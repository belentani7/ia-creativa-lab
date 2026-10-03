// BELENTANI FIRELAB — local pixel operations (client)
// Chroma key (background removal), sharpening convolution, helpers.

export interface KeyOptions {
  mode: 'green' | 'border'
  tolerance: number // 0-100
  feather: number // 0-10 px
}

/**
 * Chroma-key an ImageData in place.
 * - 'green': keys out pure chroma green (#00FF00) with spill removal.
 * - 'border': samples the average border color as key (approximate local removal).
 */
export function chromaKey(image: ImageData, options: KeyOptions): ImageData {
  const { mode, tolerance, feather } = options
  const { width, height, data } = image
  const alpha = new Float32Array(width * height)

  let kr = 0
  let kg = 255
  let kb = 0
  if (mode === 'border') {
    let r = 0
    let g = 0
    let b = 0
    let n = 0
    const sample = (x: number, y: number) => {
      const i = (y * width + x) * 4
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      n++
    }
    const step = Math.max(1, Math.floor(Math.min(width, height) / 64))
    for (let x = 0; x < width; x += step) {
      sample(x, 0)
      sample(x, height - 1)
    }
    for (let y = 0; y < height; y += step) {
      sample(0, y)
      sample(width - 1, y)
    }
    if (n === 0) return image
    kr = r / n
    kg = g / n
    kb = b / n
  }

  // normalized tolerance → distance threshold
  const t = (tolerance / 100) * 441.7 // max rgb distance
  const range = 40 + (tolerance / 100) * 60

  for (let i = 0, p = 0; p < width * height; p++, i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let dist: number
    if (mode === 'green') {
      // greenness metric: how much green exceeds both r and b
      const greenness = Math.max(0, g - Math.max(r, b))
      dist = (greenness / 255) * 300
    } else {
      dist = Math.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
    }
    let a = (dist - t) / range
    a = a < 0 ? 0 : a > 1 ? 1 : a
    alpha[p] = a
    // green spill removal on soft pixels
    if (mode === 'green' && a < 1) {
      const maxRB = Math.max(r, b)
      if (g > maxRB) data[i + 1] = Math.round(maxRB + (g - maxRB) * a)
    }
  }

  // feather: box blur on alpha (separable, 2 passes)
  const radius = Math.round(feather)
  if (radius > 0) {
    boxBlurAlpha(alpha, width, height, radius)
    boxBlurAlpha(alpha, width, height, radius)
  }

  for (let p = 0, i = 0; p < width * height; p++, i += 4) {
    data[i + 3] = Math.round(alpha[p] * 255)
  }
  return image
}

function boxBlurAlpha(alpha: Float32Array, width: number, height: number, radius: number): void {
  const temp = new Float32Array(alpha.length)
  const window = radius * 2 + 1
  // horizontal
  for (let y = 0; y < height; y++) {
    const row = y * width
    let acc = 0
    for (let x = -radius; x <= radius; x++) acc += alpha[row + Math.min(width - 1, Math.max(0, x))]
    for (let x = 0; x < width; x++) {
      temp[row + x] = acc / window
      const add = alpha[row + Math.min(width - 1, x + radius + 1)]
      const sub = alpha[row + Math.max(0, x - radius)]
      acc += add - sub
    }
  }
  // vertical
  for (let x = 0; x < width; x++) {
    let acc = 0
    for (let y = -radius; y <= radius; y++) acc += temp[Math.min(height - 1, Math.max(0, y)) * width + x]
    for (let y = 0; y < height; y++) {
      alpha[y * width + x] = acc / window
      const add = temp[Math.min(height - 1, y + radius + 1) * width + x]
      const sub = temp[Math.max(0, y - radius) * width + x]
      acc += add - sub
    }
  }
}

/** Unsharp-mask style sharpening convolution on ImageData (in place). */
export function sharpen(image: ImageData, amount = 0.5): ImageData {
  if (amount <= 0) return image
  const { width, height, data } = image
  const src = new Uint8ClampedArray(data)
  const center = 1 + 4 * amount
  const side = -amount
  const kernel = [side, side, side, side, center, side, side, side, side]
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        let acc = 0
        let k = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++, k++) {
            acc += src[(i + (dy * width + dx) * 4) + c] * kernel[k]
          }
        }
        data[i + c] = acc
      }
    }
  }
  return image
}

/** High-quality stepwise upscale of a source canvas into a destination canvas. */
export function upscaleCanvas(
  source: HTMLCanvasElement,
  factor: number,
  target?: HTMLCanvasElement
): HTMLCanvasElement {
  const dst = target ?? document.createElement('canvas')
  dst.width = Math.round(source.width * factor)
  dst.height = Math.round(source.height * factor)
  const steps: number[] = []
  let remaining = factor
  while (remaining > 1.34) {
    steps.push(1.34)
    remaining /= 1.34
  }
  steps.push(remaining)

  let current = source
  for (const step of steps) {
    const next = document.createElement('canvas')
    next.width = Math.max(1, Math.round(current.width * step))
    next.height = Math.max(1, Math.round(current.height * step))
    const ctx = next.getContext('2d')
    if (!ctx) break
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(current, 0, 0, next.width, next.height)
    current = next
  }
  const ctx = dst.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, dst.width, dst.height)
    ctx.drawImage(current, 0, 0, dst.width, dst.height)
    // finishing sharpen pass
    const imageData = ctx.getImageData(0, 0, dst.width, dst.height)
    sharpen(imageData, 0.35)
    ctx.putImageData(imageData, 0, 0)
  }
  return dst
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

// ————— local adjust operations (pure canvas transforms, client only) —————

/** Full copy of a canvas (never returns the source itself). */
export function cloneCanvas(src: HTMLCanvasElement): HTMLCanvasElement {
  const dst = document.createElement('canvas')
  dst.width = Math.max(1, src.width)
  dst.height = Math.max(1, src.height)
  const ctx = dst.getContext('2d')
  if (ctx) ctx.drawImage(src, 0, 0)
  return dst
}

/** Apply a CSS filter string (brightness/contrast/grayscale/sepia/hue-rotate). */
export function cssFilterCanvas(src: HTMLCanvasElement, filter: string): HTMLCanvasElement {
  const dst = document.createElement('canvas')
  dst.width = Math.max(1, src.width)
  dst.height = Math.max(1, src.height)
  const ctx = dst.getContext('2d')
  if (ctx) {
    ctx.filter = filter
    ctx.drawImage(src, 0, 0)
    ctx.filter = 'none'
  }
  return dst
}

/** Mirror a canvas horizontally ('h') or vertically ('v'). */
export function flipCanvas(src: HTMLCanvasElement, axis: 'h' | 'v'): HTMLCanvasElement {
  const dst = document.createElement('canvas')
  dst.width = Math.max(1, src.width)
  dst.height = Math.max(1, src.height)
  const ctx = dst.getContext('2d')
  if (ctx) {
    ctx.translate(axis === 'h' ? dst.width : 0, axis === 'v' ? dst.height : 0)
    ctx.scale(axis === 'h' ? -1 : 1, axis === 'v' ? -1 : 1)
    ctx.drawImage(src, 0, 0)
  }
  return dst
}

/** Rotate a canvas by 90° steps (1 = 90° clockwise). Re-dimensions the canvas. */
export function rotateCanvas(src: HTMLCanvasElement, turns = 1): HTMLCanvasElement {
  const t = ((turns % 4) + 4) % 4
  if (t === 0) return cloneCanvas(src)
  const swap = t % 2 === 1
  const dst = document.createElement('canvas')
  dst.width = Math.max(1, swap ? src.height : src.width)
  dst.height = Math.max(1, swap ? src.width : src.height)
  const ctx = dst.getContext('2d')
  if (ctx) {
    ctx.translate(dst.width / 2, dst.height / 2)
    ctx.rotate((t * Math.PI) / 2)
    ctx.drawImage(src, -src.width / 2, -src.height / 2)
  }
  return dst
}

/**
 * Center-crop to the largest rectangle matching the target aspect (w/h).
 * The same op runs over the image and its mask so painted regions stay aligned.
 */
export function cropToAspect(src: HTMLCanvasElement, aspect: number): HTMLCanvasElement {
  const w = Math.max(1, src.width)
  const h = Math.max(1, src.height)
  let cw: number
  let ch: number
  if (w / h > aspect) {
    // too wide — trim the width
    cw = Math.max(1, Math.round(h * aspect))
    ch = h
  } else {
    // too tall — trim the height
    cw = w
    ch = Math.max(1, Math.round(w / aspect))
  }
  const dst = document.createElement('canvas')
  dst.width = cw
  dst.height = ch
  const ctx = dst.getContext('2d')
  if (ctx) ctx.drawImage(src, -Math.floor((w - cw) / 2), -Math.floor((h - ch) / 2))
  return dst
}

/** Radial vignette — 0 (none) … 100 (strong dark corners). */
export function vignetteCanvas(src: HTMLCanvasElement, amount: number): HTMLCanvasElement {
  const dst = cloneCanvas(src)
  const a = Math.min(Math.max(amount, 0), 100) / 100
  const ctx = dst.getContext('2d')
  if (ctx && a > 0) {
    const cx = dst.width / 2
    const cy = dst.height / 2
    const outer = Math.hypot(cx, cy)
    const grad = ctx.createRadialGradient(cx, cy, outer * 0.45, cx, cy, outer)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, a * 0.85).toFixed(3)})`)
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, dst.width, dst.height)
    ctx.restore()
  }
  return dst
}

/** Unsharp-mask convolution — 0…100 slider mapped to 0.05…1.5 amount. */
export function sharpenCanvas(src: HTMLCanvasElement, amount100: number): HTMLCanvasElement {
  const dst = cloneCanvas(src)
  if (amount100 <= 0) return dst
  const ctx = dst.getContext('2d', { willReadFrequently: true })
  if (ctx) {
    const imageData = ctx.getImageData(0, 0, dst.width, dst.height)
    sharpen(imageData, Math.max(0.05, (amount100 / 100) * 1.5))
    ctx.putImageData(imageData, 0, 0)
  }
  return dst
}

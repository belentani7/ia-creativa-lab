'use client'

// BELENTANI FIRELAB — canvas editor engine (client singleton)
// Owns the image, the original snapshot (before/after), the alpha mask and
// the viewport transform. Renders into a display canvas attached by React.

import { loadImageElement, upscaleCanvas } from '../imageops'

export interface EngineSignals {
  imageLoaded: boolean
  width: number
  height: number
  canUndo: boolean
  canRedo: boolean
  hasMask: boolean
  zoom: number
}

interface HistoryEntry {
  image: string
  mask: string | null
  original: string
}

export const MAGENTA = '#FF00FF'

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, width)
  c.height = Math.max(1, height)
  return c
}

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  return ctx
}

export class FireLabEngine {
  private _image: HTMLCanvasElement | null = null
  private _original: HTMLCanvasElement | null = null
  private _mask: HTMLCanvasElement | null = null

  get image(): HTMLCanvasElement {
    if (!this._image) this._image = makeCanvas(4, 4)
    return this._image
  }
  set image(c: HTMLCanvasElement) {
    this._image = c
  }

  get original(): HTMLCanvasElement {
    if (!this._original) this._original = makeCanvas(4, 4)
    return this._original
  }
  set original(c: HTMLCanvasElement) {
    this._original = c
  }

  get mask(): HTMLCanvasElement {
    if (!this._mask) this._mask = makeCanvas(4, 4)
    return this._mask
  }
  set mask(c: HTMLCanvasElement) {
    this._mask = c
  }

  private display: HTMLCanvasElement | null = null
  private container: HTMLElement | null = null
  private resizeObserver: ResizeObserver | null = null
  private renderScheduled = false

  private zoom = 1
  private panX = 0
  private panY = 0

  brush = { size: 48, hardness: 80, erase: false }
  maskActive = false
  compare = false

  private painting = false
  private panning = false
  private lastImagePoint: { x: number; y: number } | null = null
  private panStart: { x: number; y: number; panX: number; panY: number } | null = null
  spaceHeld = false

  private maskPainted = false
  private maskRev = 0
  private tintCache: HTMLCanvasElement | null = null
  private tintRev = -1
  private checkerPattern: CanvasPattern | null = null

  private history: HistoryEntry[] = []
  private historyIndex = -1
  private snapImage: string | null = null
  private snapMask: string | null = null
  private snapOriginal: string | null = null
  private pushed = false

  onSignals: ((signals: EngineSignals) => void) | null = null
  onCursor: ((screen: { x: number; y: number } | null) => void) | null = null
  onHistoryPush: (() => void) | null = null

  // ————— attach / lifecycle —————

  attach(display: HTMLCanvasElement, container: HTMLElement): void {
    this.display = display
    this.container = container
    this.resizeObserver = new ResizeObserver(() => this.handleResize())
    this.resizeObserver.observe(container)
    display.addEventListener('pointerdown', this.onPointerDown)
    display.addEventListener('pointermove', this.onPointerMove)
    display.addEventListener('pointerup', this.onPointerUp)
    display.addEventListener('pointercancel', this.onPointerUp)
    display.addEventListener('pointerleave', this.onPointerLeave)
    display.addEventListener('wheel', this.onWheel, { passive: false })
    display.addEventListener('contextmenu', this.onContextMenu)
    this.handleResize()
    if (this.hasImage()) this.fitView()
  }

  detach(): void {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.display) {
      this.display.removeEventListener('pointerdown', this.onPointerDown)
      this.display.removeEventListener('pointermove', this.onPointerMove)
      this.display.removeEventListener('pointerup', this.onPointerUp)
      this.display.removeEventListener('pointercancel', this.onPointerUp)
      this.display.removeEventListener('pointerleave', this.onPointerLeave)
      this.display.removeEventListener('wheel', this.onWheel)
      this.display.removeEventListener('contextmenu', this.onContextMenu)
    }
    this.display = null
    this.container = null
  }

  private handleResize(): void {
    if (!this.display || !this.container) return
    const dpr = window.devicePixelRatio || 1
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (w === 0 || h === 0) return
    this.display.width = Math.round(w * dpr)
    this.display.height = Math.round(h * dpr)
    this.display.style.width = `${w}px`
    this.display.style.height = `${h}px`
    this.scheduleRender()
  }

  // ————— state helpers —————

  hasImage(): boolean {
    return this.image.width > 8
  }

  imageSize(): { width: number; height: number } {
    return { width: this.image.width, height: this.image.height }
  }

  getZoom(): number {
    return this.zoom
  }

  signals(): EngineSignals {
    return {
      imageLoaded: this.hasImage(),
      width: this.image.width,
      height: this.image.height,
      canUndo: this.historyIndex > 0,
      canRedo: this.historyIndex >= 0 && this.historyIndex < this.history.length - 1,
      hasMask: this.maskPainted,
      zoom: this.zoom,
    }
  }

  private notify(): void {
    this.onSignals?.(this.signals())
  }

  // ————— image loading —————

  async loadImageFromDataUrl(
    url: string,
    opts?: { keepOriginal?: boolean; silent?: boolean }
  ): Promise<void> {
    const img = await loadImageElement(url)
    const w = img.naturalWidth || 1024
    const h = img.naturalHeight || 1024
    const next = makeCanvas(w, h)
    ctx2d(next).drawImage(img, 0, 0, w, h)

    const hadImage = this.hasImage()
    const keepOriginal = opts?.keepOriginal ?? !hadImage

    this.image = next
    if (!keepOriginal || !hadImage) {
      const orig = makeCanvas(w, h)
      ctx2d(orig).drawImage(img, 0, 0, w, h)
      this.original = orig
      this.snapOriginal = null
    }

    // reset mask when the base changes dimension or it is a fresh base
    if (!hadImage || !opts?.keepOriginal) {
      this.mask = makeCanvas(w, h)
      this.maskPainted = false
      this.snapMask = null
    } else if (this.mask.width !== w || this.mask.height !== h) {
      const m = makeCanvas(w, h)
      ctx2d(m).drawImage(this.mask, 0, 0, w, h)
      this.mask = m
    }

    this.snapImage = null
    this.scheduleRender()
    if (!opts?.silent) this.pushHistory('both')
    if (!hadImage) this.fitView()
    this.notify()
  }

  /** Replace current image with a pre-processed canvas (live previews). */
  setProcessedImage(canvas: HTMLCanvasElement, opts?: { keepOriginal?: boolean }): void {
    this.image = canvas
    if (this.mask.width !== canvas.width || this.mask.height !== canvas.height) {
      const m = makeCanvas(canvas.width, canvas.height)
      ctx2d(m).drawImage(this.mask, 0, 0, m.width, m.height)
      this.mask = m
    }
    this.snapImage = null
    this.scheduleRender()
    this.notify()
    void opts
  }

  getImageDataUrl(type = 'image/png', quality?: number): string {
    return this.image.toDataURL(type, quality)
  }

  async exportBlob(type: string, quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.image.toBlob((blob) => resolve(blob), type, quality)
    })
  }

  // ————— view —————

  fitView(padding = 64): void {
    if (!this.container || !this.hasImage()) return
    const cw = this.container.clientWidth
    const ch = this.container.clientHeight
    const iw = this.image.width
    const ih = this.image.height
    const zoom = Math.min((cw - padding * 2) / iw, (ch - padding * 2) / ih, 8)
    this.zoom = Math.max(0.02, zoom)
    this.panX = (cw - iw * this.zoom) / 2
    this.panY = (ch - ih * this.zoom) / 2
    this.scheduleRender()
    this.notify()
  }

  setZoom(zoom: number): void {
    if (!this.container) return
    const cw = this.container.clientWidth
    const ch = this.container.clientHeight
    this.zoomAt(cw / 2, ch / 2, zoom / this.zoom)
  }

  zoomAt(screenX: number, screenY: number, factor: number): void {
    const next = Math.min(24, Math.max(0.02, this.zoom * factor))
    const ratio = next / this.zoom
    this.panX = screenX - (screenX - this.panX) * ratio
    this.panY = screenY - (screenY - this.panY) * ratio
    this.zoom = next
    this.scheduleRender()
    this.notify()
  }

  private screenToImage(screenX: number, screenY: number): { x: number; y: number } {
    return { x: (screenX - this.panX) / this.zoom, y: (screenY - this.panY) / this.zoom }
  }

  // ————— mask —————

  hasMaskPainted(): boolean {
    return this.maskPainted
  }

  maskDataUrl(): string | null {
    if (!this.maskPainted) return null
    return this.mask.toDataURL('image/png')
  }

  clearMask(): void {
    if (!this.hasImage()) return
    ctx2d(this.mask).clearRect(0, 0, this.mask.width, this.mask.height)
    this.maskPainted = false
    this.invalidateMask()
    this.pushHistory('mask')
  }

  fillMask(): void {
    if (!this.hasImage()) return
    const m = ctx2d(this.mask)
    m.save()
    m.globalCompositeOperation = 'source-over'
    m.fillStyle = '#ffffff'
    m.fillRect(0, 0, this.mask.width, this.mask.height)
    m.restore()
    this.maskPainted = true
    this.invalidateMask()
    this.pushHistory('mask')
  }

  invertMask(): void {
    if (!this.hasImage()) return
    const next = makeCanvas(this.mask.width, this.mask.height)
    const c = ctx2d(next)
    c.fillStyle = '#ffffff'
    c.fillRect(0, 0, next.width, next.height)
    c.globalCompositeOperation = 'destination-out'
    c.drawImage(this.mask, 0, 0)
    this.mask = next
    this.maskPainted = true
    this.invalidateMask()
    this.pushHistory('mask')
  }

  drawMaskPreview(target: HTMLCanvasElement): void {
    const c = ctx2d(target)
    c.clearRect(0, 0, target.width, target.height)
    c.fillStyle = '#000000'
    c.fillRect(0, 0, target.width, target.height)
    if (this.hasImage()) {
      c.drawImage(this.mask, 0, 0, target.width, target.height)
    }
  }

  private invalidateMask(): void {
    this.maskRev++
    this.snapMask = null
    this.scheduleRender()
    this.notify()
  }

  /** Restore a saved mask (project load). */
  async loadMaskFromDataUrl(url: string): Promise<void> {
    if (!this.hasImage()) return
    const img = await loadImageElement(url)
    const m = makeCanvas(this.image.width, this.image.height)
    ctx2d(m).drawImage(img, 0, 0, m.width, m.height)
    this.mask = m
    this.maskPainted = true
    this.snapMask = null
    this.invalidateMask()
    this.pushHistory('mask')
  }

  private paintStamp(x: number, y: number): void {
    const c = ctx2d(this.mask)
    const { size, hardness, erase } = this.brush
    const r = Math.max(1, size / 2)
    c.save()
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over'
    if (hardness >= 96) {
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fillStyle = 'rgba(255,255,255,1)'
      c.fill()
    } else {
      const inner = Math.max(0.01, (hardness / 100) * 0.95)
      const grad = c.createRadialGradient(x, y, r * inner * 0.2, x, y, r)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(inner, 'rgba(255,255,255,0.9)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      c.fillStyle = grad
      c.beginPath()
      c.arc(x, y, r, 0, Math.PI * 2)
      c.fill()
    }
    c.restore()
  }

  private paintTo(x: number, y: number): void {
    const last = this.lastImagePoint
    if (last) {
      const dist = Math.hypot(x - last.x, y - last.y)
      const step = Math.max(1, this.brush.size * 0.14)
      const steps = Math.ceil(dist / step)
      for (let i = 1; i <= steps; i++) {
        this.paintStamp(last.x + ((x - last.x) * i) / steps, last.y + ((y - last.y) * i) / steps)
      }
    } else {
      this.paintStamp(x, y)
    }
    this.lastImagePoint = { x, y }
    this.maskPainted = true
    this.maskRev++
    this.scheduleRender()
  }

  // ————— pointer / wheel —————

  private onContextMenu = (e: Event) => {
    e.preventDefault()
  }

  private onPointerDown = (e: PointerEvent) => {
    if (!this.display) return
    const rect = this.display.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const wantsPaint = this.maskActive && !this.spaceHeld && e.button === 0 && this.hasImage()
    const wantsPan = e.button === 1 || this.spaceHeld || (!this.maskActive && e.button === 0)
    if (wantsPaint) {
      this.display.setPointerCapture(e.pointerId)
      this.painting = true
      this.lastImagePoint = null
      const p = this.screenToImage(sx, sy)
      this.paintTo(p.x, p.y)
    } else if (wantsPan && this.hasImage()) {
      this.display.setPointerCapture(e.pointerId)
      this.panning = true
      this.panStart = { x: sx, y: sy, panX: this.panX, panY: this.panY }
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    if (!this.display) return
    const rect = this.display.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    this.onCursor?.({ x: e.clientX, y: e.clientY })
    if (this.painting) {
      const p = this.screenToImage(sx, sy)
      this.paintTo(p.x, p.y)
    } else if (this.panning && this.panStart) {
      this.panX = this.panStart.panX + (sx - this.panStart.x)
      this.panY = this.panStart.panY + (sy - this.panStart.y)
      this.scheduleRender()
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    if (this.painting) {
      this.painting = false
      this.lastImagePoint = null
      try {
        this.display?.releasePointerCapture(e.pointerId)
      } catch {
        // ignore
      }
      this.snapMask = null
      this.pushHistory('mask')
    }
    this.panning = false
    this.panStart = null
  }

  private onPointerLeave = () => {
    this.onCursor?.(null)
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    if (!this.display) return
    const rect = this.display.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    this.zoomAt(sx, sy, factor)
  }

  // ————— edit compositor —————

  /** Image with the masked region filled solid magenta (marker for edit models). */
  compositeForEdit(): { dataUrl: string; hasMask: boolean } {
    const w = this.image.width
    const h = this.image.height
    const canvas = makeCanvas(w, h)
    const c = ctx2d(canvas)
    c.drawImage(this.image, 0, 0)
    if (this.maskPainted) {
      const marker = makeCanvas(w, h)
      const mc = ctx2d(marker)
      mc.fillStyle = MAGENTA
      mc.fillRect(0, 0, w, h)
      mc.globalCompositeOperation = 'destination-in'
      mc.drawImage(this.mask, 0, 0)
      c.drawImage(marker, 0, 0)
    }
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.95), hasMask: this.maskPainted }
  }

  /**
   * Apply an edit result. When `preserveUnmasked` and a mask exists, only the
   * masked region of the result is merged in (with a feathered seam) and the
   * rest stays pixel-identical to the current image.
   */
  async applyResult(resultUrl: string, opts?: { preserveUnmasked?: boolean }): Promise<void> {
    const img = await loadImageElement(resultUrl)
    const w = img.naturalWidth || this.image.width
    const h = img.naturalHeight || this.image.height
    const result = makeCanvas(w, h)
    ctx2d(result).drawImage(img, 0, 0, w, h)

    const preserve = opts?.preserveUnmasked ?? true
    let next: HTMLCanvasElement

    if (preserve && this.maskPainted) {
      // scale mask to result dimensions, feathered
      const scaled = makeCanvas(w, h)
      const sc = ctx2d(scaled)
      sc.filter = 'blur(2px)'
      sc.drawImage(this.mask, 0, 0, w, h)
      sc.filter = 'none'
      // result masked
      const masked = makeCanvas(w, h)
      const mc = ctx2d(masked)
      mc.drawImage(result, 0, 0)
      mc.globalCompositeOperation = 'destination-in'
      mc.drawImage(scaled, 0, 0)
      // base: current image scaled to result dims
      const base = makeCanvas(w, h)
      ctx2d(base).drawImage(this.image, 0, 0, w, h)
      ctx2d(base).drawImage(masked, 0, 0)
      next = base
    } else {
      next = result
    }

    this.image = next
    if (this.mask.width !== w || this.mask.height !== h) {
      const m = makeCanvas(w, h)
      ctx2d(m).drawImage(this.mask, 0, 0, w, h)
      this.mask = m
    }
    this.snapImage = null
    this.scheduleRender()
    this.pushHistory('image')
    this.notify()
  }

  // ————— expand (outpainting prep) —————

  expandCanvas(dir: 'all' | 'h' | 'v', amount: number): boolean {
    if (!this.hasImage()) return false
    const addX = dir === 'all' ? amount : dir === 'h' ? amount : 0
    const addY = dir === 'all' ? amount : dir === 'v' ? amount : 0
    const w = this.image.width + addX * 2
    const h = this.image.height + addY * 2
    const next = makeCanvas(w, h)
    const c = ctx2d(next)
    c.fillStyle = MAGENTA
    c.fillRect(0, 0, w, h)
    // faint edge context under the magenta (color cue for edit models)
    c.globalAlpha = 0.12
    c.drawImage(this.image, 0, 0, this.image.width, this.image.height, 0, 0, w, h)
    c.globalAlpha = 1
    c.drawImage(this.image, addX, addY)
    this.image = next

    const mask = makeCanvas(w, h)
    const mc = ctx2d(mask)
    mc.fillStyle = '#ffffff'
    if (addX > 0) {
      mc.fillRect(0, 0, addX, h)
      mc.fillRect(w - addX, 0, addX, h)
    }
    if (addY > 0) {
      mc.fillRect(0, 0, w, addY)
      mc.fillRect(0, h - addY, w, addY)
    }
    this.mask = mask
    this.maskPainted = true

    this.snapImage = null
    this.snapMask = null
    this.pushHistory('both')
    this.fitView()
    return true
  }

  // ————— local upscale —————

  upscaleLocal(factor: number): boolean {
    if (!this.hasImage()) return false
    const next = upscaleCanvas(this.image, factor)
    const m = makeCanvas(next.width, next.height)
    ctx2d(m).drawImage(this.mask, 0, 0, m.width, m.height)
    this.mask = m
    this.image = next
    this.snapImage = null
    this.pushHistory('image')
    this.fitView()
    return true
  }

  getMaskCanvas(): HTMLCanvasElement {
    return this.mask
  }

  getImageCanvas(): HTMLCanvasElement {
    return this.image
  }

  // ————— local adjust ops —————

  /**
   * Apply a local (non-AI) pixel transform to the working image — CSS-filter
   * grades, flips, rotations, vignette, sharpen convolution. The transform is
   * pure: it returns a NEW canvas and never mutates the source.
   * `alsoMask` runs the same geometric transform on the mask (flip/rotate) so
   * painted regions stay aligned. Pushes an undo snapshot ('both' when the
   * mask moved) and fires the history/dirty signal — fully undo/redo-able.
   */
  applyLocalOp(
    op: (src: HTMLCanvasElement) => HTMLCanvasElement,
    opts?: { alsoMask?: boolean; refit?: boolean }
  ): boolean {
    if (!this.hasImage()) return false
    const next = op(this.image)
    let maskChanged = false
    if (opts?.alsoMask) {
      this.mask = op(this.mask)
      this.snapMask = null
      maskChanged = this.maskPainted
    } else if (this.mask.width !== next.width || this.mask.height !== next.height) {
      const m = makeCanvas(next.width, next.height)
      ctx2d(m).drawImage(this.mask, 0, 0, next.width, next.height)
      this.mask = m
    }
    this.image = next
    this.snapImage = null
    this.pushHistory(maskChanged ? 'both' : 'image')
    if (opts?.refit) this.fitView()
    this.scheduleRender()
    this.notify()
    return true
  }

  // ————— history —————

  private pushHistory(changed: 'image' | 'mask' | 'both'): void {
    if (!this.hasImage()) return
    const entry: HistoryEntry = {
      image: changed === 'mask' && this.snapImage ? this.snapImage : this.encode(this.image),
      mask:
        changed === 'image'
          ? this.snapMask
          : this.maskPainted
            ? this.encode(this.mask)
            : null,
      original: this.snapOriginal ?? this.encode(this.original),
    }
    this.snapImage = entry.image
    this.snapMask = entry.mask
    this.snapOriginal = entry.original

    this.history = this.history.slice(0, this.historyIndex + 1)
    this.history.push(entry)
    if (this.history.length > 14) this.history.shift()
    this.historyIndex = this.history.length - 1
    this.pushed = true
    this.onHistoryPush?.()
    this.notify()
  }

  private encode(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL('image/png')
  }

  async undo(): Promise<void> {
    if (this.historyIndex <= 0) return
    this.historyIndex--
    await this.restore(this.history[this.historyIndex])
  }

  async redo(): Promise<void> {
    if (this.historyIndex >= this.history.length - 1) return
    this.historyIndex++
    await this.restore(this.history[this.historyIndex])
  }

  private async restore(entry: HistoryEntry): Promise<void> {
    const [img, mask, original] = await Promise.all([
      loadImageElement(entry.image),
      entry.mask ? loadImageElement(entry.mask) : null,
      loadImageElement(entry.original),
    ])
    const next = makeCanvas(img.naturalWidth, img.naturalHeight)
    ctx2d(next).drawImage(img, 0, 0)
    this.image = next
    const nextOrig = makeCanvas(original.naturalWidth, original.naturalHeight)
    ctx2d(nextOrig).drawImage(original, 0, 0)
    this.original = nextOrig
    const nextMask = makeCanvas(next.width, next.height)
    if (mask) ctx2d(nextMask).drawImage(mask, 0, 0, next.width, next.height)
    this.mask = nextMask
    this.maskPainted = mask !== null
    this.snapImage = entry.image
    this.snapMask = entry.mask
    this.snapOriginal = entry.original
    this.maskRev++
    this.scheduleRender()
    this.notify()
  }

  everPushed(): boolean {
    return this.pushed
  }

  reset(): void {
    this._image = makeCanvas(4, 4)
    this._original = makeCanvas(4, 4)
    this._mask = makeCanvas(4, 4)
    this.maskPainted = false
    this.history = []
    this.historyIndex = -1
    this.snapImage = null
    this.snapMask = null
    this.snapOriginal = null
    this.zoom = 1
    this.panX = 0
    this.panY = 0
    this.scheduleRender()
    this.notify()
  }

  // ————— render —————

  private scheduleRender(): void {
    if (this.renderScheduled) return
    this.renderScheduled = true
    requestAnimationFrame(() => {
      this.renderScheduled = false
      this.render()
    })
  }

  requestRender(): void {
    this.scheduleRender()
  }

  private render(): void {
    const display = this.display
    const container = this.container
    if (!display || !container) return
    const ctx = ctx2d(display)
    const dpr = window.devicePixelRatio || 1
    const cw = container.clientWidth
    const ch = container.clientHeight
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cw, ch)

    if (!this.hasImage()) return

    const source = this.compare ? this.original : this.image
    const iw = source.width
    const ih = source.height
    const sx = this.panX
    const sy = this.panY
    const sw = iw * this.zoom
    const sh = ih * this.zoom

    // checkerboard (screen space) for transparency
    if (!this.checkerPattern) {
      const tile = makeCanvas(16, 16)
      const tc = ctx2d(tile)
      tc.fillStyle = '#26262a'
      tc.fillRect(0, 0, 16, 16)
      tc.fillStyle = '#1c1c1f'
      tc.fillRect(0, 0, 8, 8)
      tc.fillRect(8, 8, 8, 8)
      this.checkerPattern = ctx.createPattern(tile, 'repeat')
    }
    if (this.checkerPattern) {
      ctx.save()
      ctx.fillStyle = this.checkerPattern
      ctx.fillRect(sx, sy, sw, sh)
      ctx.restore()
    }

    // image (image space transform)
    ctx.save()
    ctx.translate(this.panX, this.panY)
    ctx.scale(this.zoom, this.zoom)
    ctx.imageSmoothingEnabled = this.zoom < 4
    ctx.drawImage(source, 0, 0)
    // mask overlay tint
    if (!this.compare && this.maskPainted) {
      if (!this.tintCache || this.tintRev !== this.maskRev) {
        const tint = makeCanvas(this.mask.width, this.mask.height)
        const tctx = ctx2d(tint)
        tctx.fillStyle = 'rgba(255,90,31,0.42)'
        tctx.fillRect(0, 0, tint.width, tint.height)
        tctx.globalCompositeOperation = 'destination-in'
        tctx.drawImage(this.mask, 0, 0)
        this.tintCache = tint
        this.tintRev = this.maskRev
      }
      ctx.drawImage(this.tintCache, 0, 0)
    }
    ctx.restore()

    // image bounds hairline (screen space)
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1
    ctx.strokeRect(sx - 0.5, sy - 0.5, sw + 1, sh + 1)
    ctx.restore()
  }
}

let engineInstance: FireLabEngine | null = null

export function getEngine(): FireLabEngine {
  if (!engineInstance) {
    engineInstance = new FireLabEngine()
  }
  return engineInstance
}

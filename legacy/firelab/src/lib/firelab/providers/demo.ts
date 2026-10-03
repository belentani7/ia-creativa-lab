// BELENTANI FIRELAB — DEMO engine (deterministic, clearly labeled, never presented as AI)
// Last-resort fallback so the UI never dies when every real provider fails.
// Produces procedural SVG artwork seeded by the prompt — always watermarked "DEMO".
// Video fallback: an animated GIF89a plasma field (same honest labeling).
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { encodeAnimatedGif, type GifFrame } from '../gif'
import { parseSize, type GeneratedImage, type GeneratedVideo, type ImageGenRequest, type ProviderAdapter, type VideoGenRequest } from './types'

function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ---- animated demo "video": procedural plasma on the ember palette ----

const DEMO_W = 320
const DEMO_H = 180
const DEMO_FRAMES = 20
const DEMO_DELAY_CS = 6 // 60 ms per frame → 1.2 s total

/** 3×5 pixel bitmap font, just the letters DEMO needs. */
const GLYPHS: Record<string, string[]> = {
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  O: ['111', '101', '101', '101', '111'],
}

function stampWatermark(rgba: Uint8ClampedArray, width: number, scale: number): void {
  const text = 'DEMO'
  const glyphW = 3 * scale
  const glyphH = 5 * scale
  const gap = scale
  const totalW = text.length * glyphW + (text.length - 1) * gap
  const x0 = width - totalW - 6
  const y0 = DEMO_H - glyphH - 5
  for (let ci = 0; ci < text.length; ci++) {
    const rows = GLYPHS[text[ci]]
    const gx = x0 + ci * (glyphW + gap)
    for (let gy = 0; gy < 5; gy++) {
      for (let gxx = 0; gxx < 3; gxx++) {
        if (rows[gy][gxx] !== '1') continue
        for (let sy = 0; sy < scale; sy++) {
          for (let sx = 0; sx < scale; sx++) {
            const px = gx + gxx * scale + sx
            const py = y0 + gy * scale + sy
            if (px < 0 || px >= width || py < 0 || py >= DEMO_H) continue
            const o = (py * width + px) * 4
            rgba[o] = 255
            rgba[o + 1] = 255
            rgba[o + 2] = 255
            rgba[o + 3] = 255
          }
        }
      }
    }
  }
}

/** HSL → RGB (h in degrees, s/l in 0..1). */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hp = ((h % 360) + 360) % 360 / 60
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0
  let g = 0
  let b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = l - c / 2
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function demoVideoGif(prompt: string, variant: number): Buffer {
  const rng = mulberry32(hashString(prompt) + variant * 7919)
  // ember palette: hue anchored in the 10–45° amber band, drifted by the field
  const hueBase = 12 + rng() * 30
  const driftSpeed = 0.5 + rng() * 1.5
  const phase1 = rng() * Math.PI * 2
  const phase2 = rng() * Math.PI * 2
  const phase3 = rng() * Math.PI * 2
  const freqX = 0.02 + rng() * 0.02
  const freqY = 0.03 + rng() * 0.02

  const frames: GifFrame[] = []
  for (let f = 0; f < DEMO_FRAMES; f++) {
    const t = (f / DEMO_FRAMES) * Math.PI * 2
    const rgba = new Uint8ClampedArray(DEMO_W * DEMO_H * 4)
    for (let y = 0; y < DEMO_H; y++) {
      for (let x = 0; x < DEMO_W; x++) {
        // layered wave field
        const v =
          Math.sin(x * freqX + t * driftSpeed + phase1) +
          Math.sin(y * freqY - t * driftSpeed + phase2) +
          Math.sin((x + y) * (freqX + freqY) * 0.5 + t + phase3)
        const norm = v / 3 // -1..1
        const hue = hueBase + norm * 18
        const light = 0.18 + 0.32 * (0.5 + 0.5 * norm) + 0.06 * Math.sin(t + x * 0.01)
        const [r, g, b] = hslToRgb(hue, 0.85, light)
        const o = (y * DEMO_W + x) * 4
        rgba[o] = r
        rgba[o + 1] = g
        rgba[o + 2] = b
        rgba[o + 3] = 255
      }
    }
    stampWatermark(rgba, DEMO_W, 3)
    frames.push({ width: DEMO_W, height: DEMO_H, rgba })
  }
  return encodeAnimatedGif(frames, DEMO_DELAY_CS)
}

function demoSvg(prompt: string, width: number, height: number, variant: number): string {
  const rng = mulberry32(hashString(prompt) + variant * 7919)
  const hues = [18, 28, 38, 350, 8]
  const blobs: string[] = []
  const n = 5 + Math.floor(rng() * 4)
  for (let i = 0; i < n; i++) {
    const cx = rng() * width
    const cy = rng() * height
    const r = (0.12 + rng() * 0.3) * Math.min(width, height)
    const hue = hues[Math.floor(rng() * hues.length)]
    const op = 0.25 + rng() * 0.45
    blobs.push(
      `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="hsl(${hue} 80% ${(
        40 +
        rng() * 25
      ).toFixed(0)}%)" opacity="${op.toFixed(2)}"/>`
    )
  }
  const rings: string[] = []
  for (let i = 0; i < 3; i++) {
    const cx = width * (0.3 + rng() * 0.4)
    const cy = height * (0.3 + rng() * 0.4)
    const r = 0.18 * Math.min(width, height) * (1 + i * 0.55)
    rings.push(
      `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="none" stroke="#ff5a1f" stroke-opacity="0.5" stroke-width="${(1 + rng() * 2).toFixed(1)}"/>`
    )
  }
  const dots: string[] = []
  for (let i = 0; i < 90; i++) {
    dots.push(
      `<rect x="${(rng() * width).toFixed(0)}" y="${(rng() * height).toFixed(0)}" width="1" height="1" fill="#ffffff" opacity="${(rng() * 0.35).toFixed(2)}"/>`
    )
  }
  const label = esc(prompt.slice(0, 96) + (prompt.length > 96 ? '…' : ''))
  const fs = Math.max(12, Math.round(width / 46))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="${width}" height="${height}" fill="#0a0a0b"/>
${blobs.join('')}
${rings.join('')}
${dots.join('')}
<text x="${width / 2}" y="${height / 2}" font-family="Georgia, serif" font-style="italic" font-size="${Math.round(width / 9)}" fill="#ff5a1f" fill-opacity="0.16" text-anchor="middle">DEMO</text>
<rect x="0" y="${height - fs * 3}" width="${width}" height="${fs * 3}" fill="#000" fill-opacity="0.55"/>
<text x="${fs}" y="${height - fs}" font-family="Helvetica, Arial, sans-serif" font-size="${fs}" fill="#c8c4bd" fill-opacity="0.85">DEMO RESULT · deterministic placeholder · ${label}</text>
</svg>`
}

export const demoProvider: ProviderAdapter = {
  id: 'demo',
  name: 'Demo Engine (deterministic)',
  kind: 'demo',
  description:
    'Deterministic procedural placeholders used when every real provider fails or when Demo Mode is enabled. Results are always watermarked and never presented as AI generations.',
  envVars: [],
  defaultPriority: 999,
  note: 'Not AI. Clearly labeled demo output.',

  async isConfigured(): Promise<boolean> {
    return true
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, variations: true, textToVideo: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    return [
      { label: 'Engine reachable', ok: true, detail: 'Demo engine is always available.' },
      { label: 'Output type', ok: true, detail: 'Deterministic SVG, watermarked DEMO.' },
    ]
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    const { width, height } = parseSize(req.size)
    return Array.from({ length: req.count }, (_, i) => {
      const svg = demoSvg(req.prompt, width, height, i)
      return {
        base64: Buffer.from(svg, 'utf8').toString('base64'),
        mime: 'image/svg+xml',
        width,
        height,
      }
    })
  },

  async generateVideos(req: VideoGenRequest): Promise<GeneratedVideo[]> {
    // size is intentionally ignored: demo video is a fixed 320×180 GIF
    return Array.from({ length: Math.min(req.count, 4) }, (_, i) => ({
      base64: demoVideoGif(req.prompt, i).toString('base64'),
      mime: 'image/gif',
      width: DEMO_W,
      height: DEMO_H,
      durationSec: (DEMO_FRAMES * DEMO_DELAY_CS) / 100,
    }))
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    return [
      {
        id: 'demo-engine',
        label: 'Demo Engine',
        capabilities: ['textToImage', 'variations', 'textToVideo'],
        status: 'available',
        note: 'Deterministic placeholder generator — not an AI model. Video fallback = procedural animated GIF.',
        source: 'bundled',
      },
    ]
  },
}

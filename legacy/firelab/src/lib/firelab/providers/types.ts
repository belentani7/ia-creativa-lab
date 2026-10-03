// BELENTANI FIRELAB — provider adapter contract (server only)
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'

export interface ImageGenRequest {
  prompt: string
  negativePrompt?: string
  size: string // 'WxH'
  count: number
  seed?: number
}

export interface ImageEditRequest {
  image: string // data URL of the (mask-composited) image
  prompt: string // full edit instruction
  size: string
  count: number
  negativePrompt?: string
  /** Data URL of the true alpha mask (white = paint). Used by mask-aware
   * adapters (A1111). The built-in engine ignores it (magenta-marker flow). */
  mask?: string
  /** Data URL of the ORIGINAL image (no magenta composite) for adapters that
   * inpaint with a real mask instead of the marker image. */
  rawImage?: string
}

export interface EnhanceRequest {
  prompt: string
  mode: 'cinematic' | 'editorial' | 'general'
}

export interface GeneratedImage {
  base64: string
  mime: string
  width: number
  height: number
}

// ---- video / music / speech / transcription / image search ----

export interface VideoGenRequest {
  prompt: string
  image?: string // data URL start frame (image-to-video)
  size: string
  durationSec?: number
  count: number
  seed?: number
}

export interface GeneratedVideo {
  base64: string
  mime: string // video/mp4 | image/gif
  width?: number
  height?: number
  durationSec?: number
}

export interface MusicRequest {
  prompt: string
  durationSec: number
  count: number
  seed?: number
}

export interface GeneratedAudio {
  base64: string
  mime: string // audio/wav | audio/mpeg
  durationSec?: number
  meta?: Record<string, unknown>
}

export interface SpeechRequest {
  text: string
  voice: string
  speed: number
}

export interface TranscriptionRequest {
  audio: string // data URL
  language?: string
}

export interface ImageSearchResult {
  url: string
  caption: string
  source: string
  width?: number
  height?: number
}

export interface ProviderAdapter {
  id: string
  name: string
  kind: 'builtin' | 'local' | 'cloud' | 'demo'
  description: string
  envVars: string[]
  docsUrl?: string
  defaultPriority: number
  note?: string
  /** Optional human hint used in the providers view when the provider is not
   * active (e.g. keyless providers explaining they activate automatically). */
  activationHint?: string
  /** Cheap check: is this provider usable right now (env key / endpoint probe)? */
  isConfigured(): Promise<boolean>
  /** What this provider genuinely supports. Drives UI controls. */
  capabilities(): Partial<Record<Capability, boolean>>
  /** Human-readable diagnostics, never logs secrets. */
  testConnection(): Promise<DiagnosticCheck[]>
  generateImages?(req: ImageGenRequest): Promise<GeneratedImage[]>
  editImage?(req: ImageEditRequest): Promise<GeneratedImage[]>
  enhancePrompt?(req: EnhanceRequest): Promise<string>
  listModels?(): Promise<ProviderModelInfo[]>
  generateVideos?(req: VideoGenRequest): Promise<GeneratedVideo[]>
  generateMusic?(req: MusicRequest): Promise<GeneratedAudio[]>
  synthesizeSpeech?(req: SpeechRequest): Promise<GeneratedAudio>
  transcribeAudio?(req: TranscriptionRequest): Promise<{ text: string }>
  searchImages?(req: { query: string; num: number }): Promise<ImageSearchResult[]>
}

export function parseSize(size: string): { width: number; height: number } {
  const [w, h] = size.toLowerCase().split(/[x*]/).map(Number)
  if (!w || !h) return { width: 1024, height: 1024 }
  return { width: w, height: h }
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function ratioString(width: number, height: number): string {
  const g = gcd(width, height) || 1
  let w = width / g
  let h = height / g
  // snap to common ratios the APIs accept
  const target = width / height
  const common: [string, number][] = [
    ['1:1', 1],
    ['4:3', 4 / 3],
    ['3:2', 1.5],
    ['16:9', 16 / 9],
    ['3:4', 3 / 4],
    ['2:3', 2 / 3],
    ['9:16', 9 / 16],
    ['21:9', 21 / 9],
  ]
  let best: [string, number] = ['1:1', 1]
  let bestDiff = Infinity
  for (const c of common) {
    const d = Math.abs(c[1] - target)
    if (d < bestDiff) {
      bestDiff = d
      best = c
    }
  }
  if (bestDiff < 0.09) return best[0]
  if (w > 64 || h > 64) {
    // reduce weird numbers to something sane
    const r = Math.round(target * 100) / 100
    w = Math.round(r * 100)
    h = 100
  }
  return `${w}:${h}`
}

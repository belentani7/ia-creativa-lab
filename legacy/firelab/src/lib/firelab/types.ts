// BELENTANI FIRELAB — shared types (client + server)

export type Capability =
  | 'textToImage'
  | 'imageToImage'
  | 'inpainting'
  | 'outpainting'
  | 'removeObject'
  | 'removeBackground'
  | 'variations'
  | 'upscale'
  | 'negativePrompt'
  | 'seed'
  | 'promptEnhance'
  | 'textToVideo'
  | 'imageToVideo'
  | 'textToMusic'
  | 'textToSpeech'
  | 'speechToText'
  | 'imageSearch'

export type ProviderKind = 'builtin' | 'local' | 'cloud' | 'demo'

export interface ProviderModelInfo {
  id: string
  label: string
  capabilities: Capability[]
  status: 'available' | 'not-configured' | 'unavailable'
  size?: string
  vram?: string
  license?: string
  source?: string
  note?: string
}

export interface ProviderInfo {
  id: string
  name: string
  kind: ProviderKind
  description: string
  envVars: string[]
  docsUrl?: string
  configured: boolean
  status: 'available' | 'not-configured' | 'unavailable' | 'error'
  statusDetail?: string
  capabilities: Partial<Record<Capability, boolean>>
  models: ProviderModelInfo[]
  priority: number
  note?: string
}

export interface DiagnosticCheck {
  label: string
  ok: boolean
  detail: string
}

export interface ProviderTestResult {
  providerId: string
  ok: boolean
  message: string
  checks: DiagnosticCheck[]
  latencyMs?: number
}

export interface FallbackEvent {
  providerId: string
  ok: boolean
  error?: string
}

export interface AssetRef {
  id: string
  url: string
  thumbUrl: string | null
  width: number
  height: number
  mime: string
}

export interface GenerationRecord {
  id: string
  kind: GenerationKind
  prompt?: string | null
  provider: string
  status: string
  error?: string | null
  durationMs?: number | null
  createdAt: string
  params: Record<string, unknown>
  assets: AssetRef[]
}

export type GenerationKind =
  | 'text-to-image'
  | 'fill'
  | 'remove'
  | 'expand'
  | 'background'
  | 'variations'
  | 'refine'
  | 'enhance'
  | 'text-to-video'
  | 'image-to-video'
  | 'music'
  | 'speech'
  | 'transcription'
  | 'image-search'

export const CAPABILITY_LABELS: Record<Capability, string> = {
  textToImage: 'Text → Image',
  imageToImage: 'Image → Image',
  inpainting: 'Generative Fill',
  outpainting: 'Generative Expand',
  removeObject: 'Remove Object',
  removeBackground: 'Background',
  variations: 'Variations',
  upscale: 'Upscale',
  negativePrompt: 'Negative prompt',
  seed: 'Seed',
  promptEnhance: 'Prompt Enhance',
  textToVideo: 'Text → Video',
  imageToVideo: 'Image → Video',
  textToMusic: 'Music',
  textToSpeech: 'Text → Speech',
  speechToText: 'Speech → Text',
  imageSearch: 'Image Search',
}

/** Sizes natively supported by the built-in engine (z-ai SDK). */
export const BUILTIN_SUPPORTED_SIZES = [
  '1024x1024',
  '768x1344',
  '864x1152',
  '1344x768',
  '1152x864',
  '1440x720',
  '720x1440',
] as const

export interface AspectPreset {
  id: string
  label: string
  ratio: number
  size: string
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: '1:1', label: '1:1', ratio: 1, size: '1024x1024' },
  { id: '4:5', label: '4:5', ratio: 0.8, size: '864x1152' },
  { id: '2:3', label: '2:3', ratio: 0.6667, size: '768x1344' },
  { id: '9:16', label: '9:16', ratio: 0.5625, size: '768x1344' },
  { id: '3:2', label: '3:2', ratio: 1.5, size: '1152x864' },
  { id: '16:9', label: '16:9', ratio: 1.7778, size: '1344x768' },
  { id: '21:9', label: '21:9', ratio: 2.3333, size: '1440x720' },
]

/** Nearest built-in-engine supported size for arbitrary dimensions. */
export function nearestSupportedSize(width: number, height: number): string {
  const target = width / height
  let best = BUILTIN_SUPPORTED_SIZES[0] as string
  let bestDiff = Infinity
  for (const s of BUILTIN_SUPPORTED_SIZES) {
    const [w, h] = s.split('x').map(Number)
    const diff = Math.abs(w / h - target) * 100 + Math.abs(w - width) / 2000
    if (diff < bestDiff) {
      bestDiff = diff
      best = s
    }
  }
  return best
}

export interface EditorSnapshot {
  imageAssetId?: string
  maskAssetId?: string
  width?: number
  height?: number
  prompt?: string
  tool?: string
  params?: Record<string, unknown>
  savedAt?: string
}

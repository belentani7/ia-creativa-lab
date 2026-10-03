// BELENTANI FIRELAB — Ollama adapter (local runtime, optional)
// Verified: GET /api/tags, POST /api/chat (stream:false), experimental image
// generation via /api/generate with image-capable models (x/z-image-turbo).
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, fetchJson, fetchWithTimeout } from './http'
import { parseSize, type EnhanceRequest, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const OLLAMA_BASE = process.env.FIRELAB_OLLAMA_URL || 'http://127.0.0.1:11434'
const TEXT_MODEL = process.env.FIRELAB_OLLAMA_TEXT_MODEL || 'qwen2.5:7b'
const IMAGE_MODEL = process.env.FIRELAB_OLLAMA_IMAGE_MODEL || 'x/z-image-turbo'

interface TagsResponse {
  models: { name: string; size: number; details?: { families?: string[] } }[]
}

interface ChatResponse {
  message?: { content?: string }
}

// /api/generate with an image model — exact response shape is not fully
// documented yet (experimental since Jan 2026), so parse defensively.
interface GenerateResponse {
  response?: string
  images?: string[]
  message?: { images?: string[] }
}

async function probe(): Promise<TagsResponse | null> {
  try {
    return await fetchJson<TagsResponse>(`${OLLAMA_BASE}/api/tags`, { timeoutMs: 1500 })
  } catch {
    return null
  }
}

function humanSize(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(0)} MB`
  return `${(bytes / 1e3).toFixed(0)} KB`
}

export const ollamaProvider: ProviderAdapter = {
  id: 'ollama',
  name: 'Ollama (local runtime)',
  kind: 'local',
  description:
    'Optional local LLM runtime for prompt enhancement, plus experimental image generation if an image-capable model (e.g. x/z-image-turbo) is pulled. Nothing leaves your machine.',
  envVars: ['FIRELAB_OLLAMA_URL', 'FIRELAB_OLLAMA_TEXT_MODEL', 'FIRELAB_OLLAMA_IMAGE_MODEL'],
  docsUrl: 'https://docs.ollama.com/',
  defaultPriority: 16,
  note: 'Detected automatically when a local Ollama is running.',

  async isConfigured(): Promise<boolean> {
    return (await probe()) !== null
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, promptEnhance: true, seed: true, negativePrompt: false }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    const tags = await probe()
    if (!tags) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: `No Ollama detected at ${OLLAMA_BASE}. Start it with \`ollama serve\`.`,
      })
      return checks
    }
    checks.push({ label: 'Endpoint reachable', ok: true, detail: `${OLLAMA_BASE} responded.` })
    checks.push({
      label: 'Models installed',
      ok: tags.models.length > 0,
      detail: tags.models.length
        ? `${tags.models.length} model(s): ${tags.models.slice(0, 5).map((m) => m.name).join(', ')}${tags.models.length > 5 ? '…' : ''}`
        : 'No models pulled yet — run `ollama pull qwen2.5:7b`.',
    })
    const hasText = tags.models.some((m) => m.name.startsWith(TEXT_MODEL.split(':')[0]))
    checks.push({
      label: `Text model (${TEXT_MODEL})`,
      ok: hasText,
      detail: hasText ? 'Installed.' : `Not installed — run \`ollama pull ${TEXT_MODEL}\`.`,
    })
    const hasImage = tags.models.some((m) => m.name.startsWith(IMAGE_MODEL.split(':')[0]))
    checks.push({
      label: `Image model (${IMAGE_MODEL})`,
      ok: hasImage,
      detail: hasImage
        ? 'Installed (experimental image generation).'
        : `Not installed — image generation needs \`ollama pull ${IMAGE_MODEL}\` (experimental).`,
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < req.count; i++) {
      const res = await fetchJson<GenerateResponse>(`${OLLAMA_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          prompt: req.prompt,
          stream: false,
          options: { seed: (req.seed ?? 0) + i },
        }),
        timeoutMs: 300000,
      })
      const raw =
        res.images?.[0] ??
        res.message?.images?.[0] ??
        (res.response && /^[A-Za-z0-9+/=\s]+$/.test(res.response.slice(0, 64)) && res.response.length > 512
          ? res.response
          : undefined)
      if (!raw) {
        throw new ProviderError(
          'response',
          `Ollama returned no image data. Is an image-capable model pulled? (ollama pull ${IMAGE_MODEL}). Image generation in Ollama is experimental — Linux support may still be pending.`
        )
      }
      results.push({ base64: raw.replace(/\s/g, ''), mime: 'image/png', width, height })
    }
    return results
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    const res = await fetchJson<ChatResponse>(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TEXT_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: req.prompt },
        ],
      }),
      timeoutMs: 120000,
    })
    const content = res.message?.content?.trim()
    if (!content) throw new ProviderError('response', 'Ollama returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const tags = await probe()
    if (!tags) {
      return [
        {
          id: 'ollama-unavailable',
          label: 'Ollama not reachable',
          capabilities: [],
          status: 'unavailable',
          note: `Start Ollama at ${OLLAMA_BASE} to list installed models.`,
        },
      ]
    }
    return tags.models.map((m) => ({
      id: m.name,
      label: m.name,
      capabilities: m.name.includes('image') || m.name.includes('z-image')
        ? (['textToImage'] as Capability[])
        : (['promptEnhance'] as Capability[]),
      status: 'available' as const,
      size: humanSize(m.size),
      source: 'ollama',
      note: m.name.includes('image')
        ? 'Experimental image generation via /api/generate.'
        : 'Local text model — prompt enhancement.',
    }))
  },
}

// keep fetchWithTimeout import used (future uploads)
void fetchWithTimeout

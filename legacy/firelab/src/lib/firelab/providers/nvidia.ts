// BELENTANI FIRELAB — NVIDIA NIM adapter (cloud, optional)
// Verified: POST https://ai.api.nvidia.com/v1/genai/{owner}/{model}
// (e.g. stabilityai/stable-diffusion-xl) with Bearer auth; body includes
// prompt, negative_prompt, aspect_ratio, cfg_scale, seed, steps, mode;
// response contains artifacts[0].base64.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, fetchJson, fetchWithTimeout } from './http'
import { parseSize, ratioString, type EnhanceRequest, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const API_KEY = process.env.NVIDIA_API_KEY || ''
const BASE = process.env.FIRELAB_NVIDIA_BASE || 'https://ai.api.nvidia.com'
const IMAGE_MODEL = process.env.FIRELAB_NVIDIA_IMAGE_MODEL || 'stabilityai/stable-diffusion-xl'
const TEXT_MODEL = process.env.FIRELAB_NVIDIA_TEXT_MODEL || ''
const CHAT_BASE = process.env.FIRELAB_NVIDIA_CHAT_BASE || 'https://integrate.api.nvidia.com/v1'

interface NvidiaImageResponse {
  artifacts?: { base64?: string; finish_reason?: string }[]
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

function imageUrl(): string {
  return `${BASE.replace(/\/$/, '')}/v1/genai/${IMAGE_MODEL.replace(/^\/+/, '')}`
}

export const nvidiaProvider: ProviderAdapter = {
  id: 'nvidia',
  name: 'NVIDIA NIM (cloud)',
  kind: 'cloud',
  description:
    'NVIDIA build.nvidia.com image generation (Stable Diffusion family). Trial usage is rate-limited rather than permanently free — treat as an optional booster, not a dependency. Set NVIDIA_API_KEY to activate.',
  envVars: ['NVIDIA_API_KEY', 'FIRELAB_NVIDIA_IMAGE_MODEL', 'FIRELAB_NVIDIA_TEXT_MODEL'],
  docsUrl: 'https://docs.api.nvidia.com/nim/reference/stabilityai-stable-diffusion-xl-infer',
  defaultPriority: 55,
  note: 'Trial/rate-limited (per NVIDIA forums the credit system moved to rate limits). Handles 402/429 gracefully.',

  async isConfigured(): Promise<boolean> {
    return API_KEY.length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return {
      textToImage: true,
      negativePrompt: true,
      seed: true,
      promptEnhance: TEXT_MODEL.length > 0,
    }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!API_KEY) {
      checks.push({
        label: 'API key',
        ok: false,
        detail: 'NVIDIA_API_KEY is not set — provider stays inactive.',
      })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'NVIDIA_API_KEY present (server-side only).' })
    try {
      // cheap authenticated call on the OpenAI-compatible NIM surface
      const res = await fetchWithTimeout(`${CHAT_BASE}/models`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeoutMs: 15000,
      })
      if (res.ok) {
        checks.push({ label: 'Authentication', ok: true, detail: 'Key accepted by the NIM API.' })
      } else if (res.status === 401 || res.status === 403) {
        checks.push({ label: 'Authentication', ok: false, detail: `Key rejected (HTTP ${res.status}).` })
      } else {
        checks.push({
          label: 'Authentication',
          ok: false,
          detail: `HTTP ${res.status}. Endpoint may differ for your account — copy the exact URL from build.nvidia.com model page.`,
        })
      }
    } catch (err) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    checks.push({
      label: `Image endpoint (${imageUrl()})`,
      ok: true,
      detail: 'Verified on first generation. If your account uses a different model path, set FIRELAB_NVIDIA_IMAGE_MODEL.',
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!API_KEY) throw new ProviderError('auth', 'NVIDIA_API_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < req.count; i++) {
      const res = await fetchJson<NvidiaImageResponse>(imageUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt: req.prompt,
          ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
          aspect_ratio: ratioString(width, height),
          cfg_scale: 5,
          seed: (req.seed ?? Math.floor(Math.random() * 1e9)) + i,
          steps: 30,
          mode: 'text-to-image',
          output_format: 'png',
        }),
        timeoutMs: 120000,
      })
      const base64 = res.artifacts?.[0]?.base64
      if (!base64) {
        throw new ProviderError('response', 'NVIDIA returned no image artifact (quota or model issue).')
      }
      results.push({ base64, mime: 'image/png', width, height })
    }
    return results
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    if (!API_KEY) throw new ProviderError('auth', 'NVIDIA_API_KEY is not configured.')
    if (!TEXT_MODEL) {
      throw new ProviderError(
        'unsupported',
        'Set FIRELAB_NVIDIA_TEXT_MODEL (e.g. meta/llama-3.1-70b-instruct) to use NVIDIA for prompt enhancement.'
      )
    }
    const res = await fetchJson<ChatResponse>(`${CHAT_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: req.prompt },
        ],
      }),
      timeoutMs: 60000,
    })
    const content = res.choices?.[0]?.message?.content?.trim()
    if (!content) throw new ProviderError('response', 'NVIDIA returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = API_KEY ? 'available' : 'not-configured'
    return [
      {
        id: 'stabilityai/stable-diffusion-xl',
        label: 'stabilityai/stable-diffusion-xl',
        capabilities: ['textToImage', 'negativePrompt', 'seed'],
        status: st,
        source: 'build.nvidia.com',
        note: 'Default image model. /v1/genai/stabilityai/stable-diffusion-xl',
      },
      {
        id: 'stabilityai/stable-diffusion-3-medium',
        label: 'stabilityai/stable-diffusion-3-medium',
        capabilities: ['textToImage', 'negativePrompt', 'seed'],
        status: st,
        source: 'build.nvidia.com',
        note: '/v1/genai/stabilityai/stable-diffusion-3-medium',
      },
    ]
  },
}

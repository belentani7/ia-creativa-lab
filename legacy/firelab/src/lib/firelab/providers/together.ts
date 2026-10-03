// BELENTANI FIRELAB — Together AI adapter (cloud, optional)
// VERIFIED OpenAPI: POST https://api.together.xyz/v1/images/generations
// {model, prompt, width, height, steps, n, response_format, output_format}
// → {data: [{b64_json}]} (a {url} shape is also handled by downloading).
// The "black-forest-labs/FLUX.1-schnell-Free" model is their free endpoint.
// Prompt enhancement via POST /v1/chat/completions.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, classifyHttpStatus, fetchJson, fetchWithTimeout } from './http'
import { parseSize, type EnhanceRequest, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const BASE = 'https://api.together.xyz/v1'

interface ImagesResponse {
  data?: { b64_json?: string; url?: string }[]
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

function apiKey(): string {
  return process.env.TOGETHER_API_KEY || ''
}

function imageModel(): string {
  return process.env.FIRELAB_TOGETHER_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell-Free'
}

function textModel(): string {
  return process.env.FIRELAB_TOGETHER_TEXT_MODEL || 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free'
}

export const togetherProvider: ProviderAdapter = {
  id: 'together',
  name: 'Together AI (cloud)',
  kind: 'cloud',
  description:
    'Together image generation (FLUX.1-schnell-Free — their free endpoint) plus LLM chat for prompt enhancement. Set TOGETHER_API_KEY to activate.',
  envVars: ['TOGETHER_API_KEY', 'FIRELAB_TOGETHER_IMAGE_MODEL', 'FIRELAB_TOGETHER_TEXT_MODEL'],
  docsUrl: 'https://docs.together.ai',
  defaultPriority: 65,
  note: 'Free FLUX.1-schnell endpoint (rate-limited) + free Llama-3.3-70B-Turbo tier.',

  async isConfigured(): Promise<boolean> {
    return apiKey().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, promptEnhance: true, seed: true, negativePrompt: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!apiKey()) {
      checks.push({ label: 'API key', ok: false, detail: 'TOGETHER_API_KEY is not set — provider stays inactive.' })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'TOGETHER_API_KEY present (server-side only).' })
    try {
      const res = await fetchWithTimeout(`${BASE}/models`, {
        headers: { Authorization: `Bearer ${apiKey()}` },
        timeoutMs: 15000,
      })
      checks.push({
        label: 'Authentication',
        ok: res.ok,
        detail: res.ok ? 'Key accepted by api.together.xyz.' : `Key rejected (HTTP ${res.status}).`,
      })
    } catch (err) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    checks.push({
      label: `Image model (${imageModel()})`,
      ok: true,
      detail: 'The "…-Free" suffix is their free tier — verified on first generation.',
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!apiKey()) throw new ProviderError('auth', 'TOGETHER_API_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const res = await fetchJson<ImagesResponse>(`${BASE}/images/generations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: imageModel(),
          prompt: req.prompt,
          ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
          width,
          height,
          steps: 4,
          n: 1,
          response_format: 'base64',
          output_format: 'png',
          ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
        }),
        timeoutMs: 120000,
      })
      const item = res.data?.[0]
      if (!item) throw new ProviderError('response', 'Together returned no image data.')
      if (item.b64_json) {
        results.push({ base64: item.b64_json, mime: 'image/png', width, height })
      } else if (item.url) {
        const dl = await fetchWithTimeout(item.url, { timeoutMs: 60000 })
        if (!dl.ok) {
          throw new ProviderError(
            classifyHttpStatus(dl.status, ''),
            `Together result download failed: HTTP ${dl.status}`
          )
        }
        const mime = (dl.headers.get('content-type') || 'image/png').split(';')[0]
        const buffer = Buffer.from(await dl.arrayBuffer())
        results.push({ base64: buffer.toString('base64'), mime, width, height })
      } else {
        throw new ProviderError('response', 'Together returned neither b64_json nor url.')
      }
    }
    return results
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    if (!apiKey()) throw new ProviderError('auth', 'TOGETHER_API_KEY is not configured.')
    const res = await fetchJson<ChatResponse>(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: textModel(),
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: req.prompt },
        ],
      }),
      timeoutMs: 60000,
    })
    const content = res.choices?.[0]?.message?.content?.trim()
    if (!content) throw new ProviderError('response', 'Together returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = apiKey() ? 'available' : 'not-configured'
    return [
      {
        id: 'black-forest-labs/FLUX.1-schnell-Free',
        label: 'FLUX.1-schnell (Free)',
        capabilities: ['textToImage', 'seed'],
        status: st,
        source: 'docs.together.ai',
        note: 'Free tier image endpoint — default.',
      },
      {
        id: 'black-forest-labs/FLUX.1-schnell',
        label: 'FLUX.1-schnell',
        capabilities: ['textToImage', 'seed'],
        status: st,
        source: 'docs.together.ai',
        note: 'Paid variant — set FIRELAB_TOGETHER_IMAGE_MODEL to use it.',
      },
      {
        id: textModel(),
        label: textModel(),
        capabilities: ['promptEnhance'],
        status: st,
        source: 'docs.together.ai',
        note: 'Free-tier Llama 3.3 70B Turbo — prompt enhancement.',
      },
    ]
  },
}

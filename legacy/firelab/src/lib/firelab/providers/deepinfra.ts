// BELENTANI FIRELAB — DeepInfra adapter (cloud, optional)
// Image: POST https://api.deepinfra.com/v1/inference/black-forest-labs/FLUX.1-schnell
// {prompt, width, height} with Bearer key → {images: ["data:image/jpeg;base64,…"]}.
// Text: POST https://api.deepinfra.com/v1/openai/chat/completions (OpenAI shape).
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, fetchJson } from './http'
import { parseSize, type EnhanceRequest, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const IMAGE_URL = 'https://api.deepinfra.com/v1/inference'
const CHAT_URL = 'https://api.deepinfra.com/v1/openai/chat/completions'

interface InferenceResponse {
  images?: string[]
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

function apiKey(): string {
  return process.env.DEEPINFRA_API_KEY || ''
}

function imageModel(): string {
  return process.env.FIRELAB_DEEPINFRA_IMAGE_MODEL || 'black-forest-labs/FLUX.1-schnell'
}

function textModel(): string {
  return process.env.FIRELAB_DEEPINFRA_TEXT_MODEL || 'meta-llama/Llama-3.3-70B-Instruct'
}

export const deepinfraProvider: ProviderAdapter = {
  id: 'deepinfra',
  name: 'DeepInfra (cloud)',
  kind: 'cloud',
  description:
    'DeepInfra model inference — FLUX.1-schnell images plus OpenAI-compatible chat for prompt enhancement. Set DEEPINFRA_API_KEY to activate.',
  envVars: ['DEEPINFRA_API_KEY', 'FIRELAB_DEEPINFRA_IMAGE_MODEL', 'FIRELAB_DEEPINFRA_TEXT_MODEL'],
  docsUrl: 'https://deepinfra.com',
  defaultPriority: 80,
  note: 'Signup credits; response shape may vary — errors surface as provider diagnostics.',

  async isConfigured(): Promise<boolean> {
    return apiKey().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, promptEnhance: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!apiKey()) {
      checks.push({ label: 'API key', ok: false, detail: 'DEEPINFRA_API_KEY is not set — provider stays inactive.' })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'DEEPINFRA_API_KEY present (server-side only).' })
    checks.push({
      label: `Image model (${imageModel()})`,
      ok: true,
      detail: `POST ${IMAGE_URL}/${imageModel()} — verified on first generation.`,
    })
    checks.push({
      label: `Text model (${textModel()})`,
      ok: true,
      detail: `POST ${CHAT_URL} — verified on first enhancement.`,
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!apiKey()) throw new ProviderError('auth', 'DEEPINFRA_API_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const res = await fetchJson<InferenceResponse>(`${IMAGE_URL}/${imageModel()}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: req.prompt,
          width,
          height,
          ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
        }),
        timeoutMs: 120000,
      })
      const raw = res.images?.[0]
      if (!raw) {
        throw new ProviderError('response', 'DeepInfra returned no images (quota or model issue).')
      }
      results.push({
        base64: raw.replace(/^data:[^,]*,/, ''),
        mime: (raw.match(/^data:([^;,]+)/)?.[1] ?? 'image/jpeg').split(';')[0],
        width,
        height,
      })
    }
    return results
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    if (!apiKey()) throw new ProviderError('auth', 'DEEPINFRA_API_KEY is not configured.')
    const res = await fetchJson<ChatResponse>(CHAT_URL, {
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
    if (!content) throw new ProviderError('response', 'DeepInfra returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = apiKey() ? 'available' : 'not-configured'
    return [
      {
        id: imageModel(),
        label: imageModel(),
        capabilities: ['textToImage'],
        status: st,
        source: 'deepinfra.com',
      },
      {
        id: textModel(),
        label: textModel(),
        capabilities: ['promptEnhance'],
        status: st,
        source: 'deepinfra.com',
      },
    ]
  },
}

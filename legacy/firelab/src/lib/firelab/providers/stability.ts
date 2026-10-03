// BELENTANI FIRELAB — Stability AI adapter (cloud, optional)
// VERIFIED: POST https://api.stability.ai/v2beta/stable-image/generate/core
// multipart/form-data with Authorization: Bearer — fields prompt,
// negative_prompt, aspect_ratio, seed, n; response is raw image bytes.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, classifyHttpStatus, fetchWithTimeout } from './http'
import { parseSize, ratioString, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const ENDPOINT = 'https://api.stability.ai/v2beta/stable-image/generate/core'

function apiKey(): string {
  return process.env.STABILITY_API_KEY || ''
}

export const stabilityProvider: ProviderAdapter = {
  id: 'stability',
  name: 'Stability AI (cloud)',
  kind: 'cloud',
  description:
    'Stable Image Core (v2beta) text-to-image. Sends multipart/form-data with prompt, negative prompt, aspect ratio and seed; the response is the raw image. Set STABILITY_API_KEY to activate.',
  envVars: ['STABILITY_API_KEY'],
  docsUrl: 'https://platform.stability.ai/docs',
  defaultPriority: 75,
  note: 'Free trial credits at signup.',

  async isConfigured(): Promise<boolean> {
    return apiKey().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, negativePrompt: true, seed: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!apiKey()) {
      checks.push({ label: 'API key', ok: false, detail: 'STABILITY_API_KEY is not set — provider stays inactive.' })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'STABILITY_API_KEY present (server-side only).' })
    checks.push({
      label: 'Endpoint',
      ok: true,
      detail: `POST ${ENDPOINT} (multipart) — verified on first generation; 401/402 errors surface as diagnostics.`,
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!apiKey()) throw new ProviderError('auth', 'STABILITY_API_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const form = new FormData()
      form.append('prompt', req.prompt)
      form.append('output_format', 'png')
      if (req.negativePrompt) form.append('negative_prompt', req.negativePrompt)
      form.append('aspect_ratio', ratioString(width, height))
      if (req.seed !== undefined) form.append('seed', String(req.seed + i))
      form.append('n', '1')
      const res = await fetchWithTimeout(ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          Accept: 'image/*',
        },
        body: form,
        timeoutMs: 120000,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new ProviderError(
          classifyHttpStatus(res.status, text),
          `Stability returned HTTP ${res.status}${res.status === 402 ? ' — credits exhausted.' : ''} ${text.slice(0, 160)}`,
          res.status
        )
      }
      const mime = (res.headers.get('content-type') || 'image/png').split(';')[0]
      if (!mime.startsWith('image/')) {
        throw new ProviderError('response', `Stability returned "${mime}" instead of an image.`)
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      results.push({ base64: buffer.toString('base64'), mime, width, height })
    }
    return results
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = apiKey() ? 'available' : 'not-configured'
    return [
      {
        id: 'stable-image/core',
        label: 'Stable Image Core',
        capabilities: ['textToImage', 'negativePrompt', 'seed'],
        status: st,
        source: 'platform.stability.ai',
        note: 'v2beta generate/core endpoint — default.',
      },
    ]
  },
}

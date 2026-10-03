// BELENTANI FIRELAB — Cloudflare Workers AI adapter (cloud, optional)
// VERIFIED: POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
// with Bearer token; body {prompt, steps, seed} → JSON containing a base64
// image — both shapes {result: {image}} and {image} are accepted.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, fetchJson, fetchWithTimeout } from './http'
import { parseSize, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

interface RunResponse {
  result?: { image?: string; seed?: number }
  image?: string
  success?: boolean
  errors?: { message?: string }[]
}

function accountId(): string {
  return process.env.CLOUDFLARE_ACCOUNT_ID || ''
}

function apiToken(): string {
  return process.env.CLOUDFLARE_API_TOKEN || ''
}

function imageModel(): string {
  return process.env.FIRELAB_CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell'
}

function runUrl(): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId()}/ai/run/${imageModel()}`
}

export const cloudflareProvider: ProviderAdapter = {
  id: 'cloudflare',
  name: 'Cloudflare Workers AI (cloud)',
  kind: 'cloud',
  description:
    'Workers AI REST inference (@cf/black-forest-labs/flux-1-schnell by default). Requires both CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
  envVars: ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'FIRELAB_CLOUDFLARE_IMAGE_MODEL'],
  docsUrl: 'https://developers.cloudflare.com/workers-ai',
  defaultPriority: 70,
  note: '10k neurons/day free allocation (verify in dashboard).',

  async isConfigured(): Promise<boolean> {
    return accountId().length > 0 && apiToken().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, seed: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!accountId() || !apiToken()) {
      checks.push({
        label: 'Credentials',
        ok: false,
        detail:
          'CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must both be set — provider stays inactive.',
      })
      return checks
    }
    checks.push({ label: 'Credentials', ok: true, detail: 'Account id + API token present (server-side only).' })
    try {
      const res = await fetchWithTimeout(runUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: 'a solid red square', steps: 1 }),
        timeoutMs: 60000,
      })
      const body = (await res.json().catch(() => ({}))) as RunResponse
      const okShape = res.ok && (body.result?.image !== undefined || body.image !== undefined)
      checks.push({
        label: `Model reachable (${imageModel()})`,
        ok: okShape,
        detail: okShape
          ? 'Test run returned an image.'
          : `HTTP ${res.status}${body.errors?.[0]?.message ? ` — ${body.errors[0].message}` : ''}`,
      })
    } catch (err) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!accountId() || !apiToken()) {
      throw new ProviderError('auth', 'CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN are not configured.')
    }
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const res = await fetchJson<RunResponse>(runUrl(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: req.prompt,
          steps: 4,
          ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
        }),
        timeoutMs: 120000,
      })
      const b64 = res.result?.image ?? res.image
      if (!b64) {
        const detail = res.errors?.[0]?.message
        throw new ProviderError(
          'response',
          `Cloudflare returned no image${detail ? ` — ${detail}` : ' (model or quota issue).'}`,
        )
      }
      results.push({
        base64: b64.replace(/^data:[^,]*,/, ''),
        mime: 'image/png',
        width,
        height,
      })
    }
    return results
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = accountId() && apiToken() ? 'available' : 'not-configured'
    return [
      {
        id: imageModel(),
        label: imageModel(),
        capabilities: ['textToImage', 'seed'],
        status: st,
        source: 'developers.cloudflare.com/workers-ai',
        note: 'FLUX schnell — 4 steps. Free allocation of ~10k neurons/day.',
      },
    ]
  },
}

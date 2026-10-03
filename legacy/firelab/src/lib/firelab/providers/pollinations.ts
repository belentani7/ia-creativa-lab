// BELENTANI FIRELAB — Pollinations adapter (keyless cloud, optional)
// VERIFIED LIVE (research Task 6): image GET
// https://image.pollinations.ai/prompt/{prompt}?width&height&seed&nologo=true
// returns raw JPEG bytes (anonymous model = "sana"); text via
// POST https://text.pollinations.ai/openai (OpenAI-compatible, model
// "openai" → gpt-oss-20b on the anonymous tier). Anonymous rate limit is
// ~1 image request / 15 s — enforced by a module-level serialized queue.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, classifyHttpStatus, fetchJson, fetchWithTimeout, sleep } from './http'
import { parseSize, type EnhanceRequest, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

interface ModelsResponse {
  name?: string
  id?: string
  description?: string
  tier?: string
}

// ---- anonymous-tier rate limiting: serialize image calls, 16 s spacing ----

let imageQueue: Promise<void> = Promise.resolve()
let lastImageStart = 0

async function acquireImageSlot(): Promise<void> {
  const slot = imageQueue.then(async () => {
    const since = Date.now() - lastImageStart
    if (since < 16000) await sleep(16000 - since)
    lastImageStart = Date.now()
  })
  imageQueue = slot.catch(() => undefined) // keep the chain alive on failure
  return slot
}

export const pollinationsProvider: ProviderAdapter = {
  id: 'pollinations',
  name: 'Pollinations (keyless cloud)',
  kind: 'cloud',
  description:
    'Keyless community image + text service. The first cloud fallback with zero configuration: activates automatically whenever it is reachable. Anonymous tier is rate-limited to roughly one image per 15 seconds (enforced by FireLab).',
  envVars: ['FIRELAB_POLLINATIONS_IMAGE_MODEL', 'FIRELAB_POLLINATIONS_TEXT_MODEL'],
  docsUrl: 'https://github.com/pollinations/pollinations/blob/master/APIDOCS.md',
  defaultPriority: 40,
  note: 'Free anonymous tier: ~1 image per 15 s, watermark possible. No API key required — ever.',
  activationHint: 'Pollinations is keyless — it activates automatically when reachable.',

  async isConfigured(): Promise<boolean> {
    try {
      const res = await fetchWithTimeout('https://text.pollinations.ai/models', { timeoutMs: 8000 })
      return res.ok
    } catch {
      return false
    }
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, promptEnhance: true, seed: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    try {
      const res = await fetchWithTimeout('https://text.pollinations.ai/models', { timeoutMs: 8000 })
      checks.push({
        label: 'Text endpoint reachable',
        ok: res.ok,
        detail: res.ok
          ? 'text.pollinations.ai answered (keyless anonymous tier).'
          : `HTTP ${res.status} — service may be busy; retry later.`,
      })
    } catch (err) {
      checks.push({
        label: 'Text endpoint reachable',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
      return checks
    }
    try {
      const models = await res2Models()
      checks.push({
        label: 'Models listed',
        ok: models.length > 0,
        detail: models.length
          ? `${models.length} text model(s): ${models.slice(0, 3).map((m) => m.id).join(', ')}`
          : 'Model catalog empty.',
      })
    } catch (err) {
      checks.push({
        label: 'Models listed',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    checks.push({
      label: 'Image endpoint',
      ok: true,
      detail: 'image.pollinations.ai (anonymous model "sana") — verified on first generation; ~1 request / 15 s.',
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    const { width, height } = parseSize(req.size)
    const model = process.env.FIRELAB_POLLINATIONS_IMAGE_MODEL
    const results: GeneratedImage[] = []
    for (let i = 0; i < req.count; i++) {
      await acquireImageSlot()
      const params = new URLSearchParams({
        width: String(width),
        height: String(height),
        nologo: 'true',
      })
      if (req.seed !== undefined) params.set('seed', String(req.seed + i))
      if (model) params.set('model', model)
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(req.prompt)}?${params.toString()}`
      const res = await fetchWithTimeout(url, { timeoutMs: 120000 })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const code = classifyHttpStatus(res.status, text)
        throw new ProviderError(
          code,
          `Pollinations returned HTTP ${res.status}${res.status === 429 ? ' — anonymous limit is ~1 image / 15 s; FireLab serializes requests, try again shortly.' : ''} ${text.slice(0, 160)}`,
          res.status
        )
      }
      const mime = (res.headers.get('content-type') || 'image/jpeg').split(';')[0]
      if (!mime.startsWith('image/')) {
        throw new ProviderError('response', `Pollinations returned "${mime}" instead of an image.`)
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length === 0) {
        throw new ProviderError('response', 'Pollinations returned an empty image payload.')
      }
      results.push({ base64: buffer.toString('base64'), mime: 'image/jpeg', width, height })
    }
    return results
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    const model = process.env.FIRELAB_POLLINATIONS_TEXT_MODEL || 'openai'
    const res = await fetchJson<ChatResponse>('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: req.prompt },
        ],
      }),
      timeoutMs: 60000,
    })
    const content = res.choices?.[0]?.message?.content?.trim()
    if (!content) throw new ProviderError('response', 'Pollinations returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const models = await res2Models()
    const imageModel = process.env.FIRELAB_POLLINATIONS_IMAGE_MODEL
    const out: ProviderModelInfo[] = models.map((m) => ({
      id: m.id,
      label: m.label,
      capabilities: ['promptEnhance'] as Capability[],
      status: 'available' as const,
      source: 'text.pollinations.ai',
    }))
    out.push({
      id: imageModel || 'sana (anonymous)',
      label: imageModel || 'sana (anonymous image model)',
      capabilities: ['textToImage', 'seed'],
      status: 'available',
      source: 'image.pollinations.ai',
      note: 'Keyless. Set FIRELAB_POLLINATIONS_IMAGE_MODEL to pick a specific model.',
    })
    return out
  },
}

async function res2Models(): Promise<{ id: string; label: string }[]> {
  const models = await fetchJson<ModelsResponse[]>('https://text.pollinations.ai/models', {
    timeoutMs: 8000,
  })
  return models
    .map((m) => ({ id: m.name ?? m.id ?? '', label: m.description ?? m.name ?? m.id ?? '' }))
    .filter((m) => m.id.length > 0)
}

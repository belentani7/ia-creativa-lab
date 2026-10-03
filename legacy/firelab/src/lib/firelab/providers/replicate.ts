// BELENTANI FIRELAB — Replicate adapter (cloud, optional)
// VERIFIED official-model flow: POST
// https://api.replicate.com/v1/models/{owner}/{model}/predictions with
// Authorization: Bearer + Prefer: wait (synchronous up to ~60 s); if the
// prediction is still running, poll GET /v1/predictions/{id} until
// succeeded/failed. Outputs arrive as a URL or an array — normalized here.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, classifyHttpStatus, fetchJson, fetchWithTimeout, sleep } from './http'
import { parseSize, type GeneratedAudio, type GeneratedImage, type GeneratedVideo, type ImageGenRequest, type MusicRequest, type ProviderAdapter, type VideoGenRequest } from './types'

const BASE = 'https://api.replicate.com/v1'

interface PredictionResponse {
  id?: string
  status?: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string | string[]
  error?: string | null
  urls?: { get?: string }
}

function apiToken(): string {
  return process.env.REPLICATE_API_TOKEN || ''
}

function imageModel(): string {
  return process.env.FIRELAB_REPLICATE_IMAGE_MODEL || 'black-forest-labs/flux-schnell'
}

function t2vModel(): string {
  return process.env.FIRELAB_REPLICATE_T2V_MODEL || 'wan-video/wan-2.1-t2v-fast'
}

function musicModel(): string {
  return process.env.FIRELAB_REPLICATE_MUSIC_MODEL || 'meta/musicgen'
}

function headers(preferWait = false): Record<string, string> {
  return {
    Authorization: `Bearer ${apiToken()}`,
    'Content-Type': 'application/json',
    ...(preferWait ? { Prefer: 'wait' } : {}),
  }
}

function normalizeOutput(pred: PredictionResponse): string[] {
  if (pred.output === undefined || pred.output === null) return []
  const arr = Array.isArray(pred.output) ? pred.output : [pred.output]
  return arr.filter((o): o is string => typeof o === 'string' && o.length > 0)
}

async function runPrediction(model: string, input: Record<string, unknown>): Promise<string[]> {
  const initial = await fetchJson<PredictionResponse>(`${BASE}/models/${model}/predictions`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify({ input }),
    timeoutMs: 70000,
  })
  let pred = initial
  // Prefer: wait covers ≤60 s; longer runs need polling
  const deadline = Date.now() + 300000
  while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
    if (Date.now() > deadline) {
      throw new ProviderError('timeout', 'Replicate prediction did not finish within 5 minutes.')
    }
    await sleep(2500)
    const getUrl = pred.urls?.get ?? (pred.id ? `${BASE}/predictions/${pred.id}` : null)
    if (!getUrl) throw new ProviderError('response', 'Replicate returned no prediction URL to poll.')
    pred = await fetchJson<PredictionResponse>(getUrl, { headers: headers(), timeoutMs: 30000 })
  }
  if (pred.status !== 'succeeded') {
    throw new ProviderError('response', `Replicate prediction ${pred.status}: ${pred.error ?? 'no detail'}`)
  }
  const outputs = normalizeOutput(pred)
  if (outputs.length === 0) {
    throw new ProviderError('response', 'Replicate prediction succeeded but returned no output URL.')
  }
  return outputs
}

async function downloadBytes(url: string, expectPrefix: string, timeoutMs = 300000): Promise<{ base64: string; mime: string }> {
  const res = await fetchWithTimeout(url, { timeoutMs })
  if (!res.ok) {
    throw new ProviderError(
      classifyHttpStatus(res.status, ''),
      `Replicate output download failed: HTTP ${res.status}`
    )
  }
  const mime = (res.headers.get('content-type') || expectPrefix).split(';')[0]
  if (!mime.startsWith(expectPrefix)) {
    throw new ProviderError('response', `Replicate output was "${mime}" (expected ${expectPrefix}).`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length === 0) throw new ProviderError('response', 'Replicate output download returned no bytes.')
  if (buffer.length > 80 * 1024 * 1024) {
    throw new ProviderError('response', 'Replicate output exceeds the 80 MB download cap.')
  }
  return { base64: buffer.toString('base64'), mime }
}

export const replicateProvider: ProviderAdapter = {
  id: 'replicate',
  name: 'Replicate (cloud)',
  kind: 'cloud',
  description:
    'Replicate official-model predictions — FLUX.1-schnell images, Wan 2.1 t2v-fast video (experimental) and Meta MusicGen audio. Per-run pricing. Set REPLICATE_API_TOKEN to activate.',
  envVars: ['REPLICATE_API_TOKEN', 'FIRELAB_REPLICATE_IMAGE_MODEL', 'FIRELAB_REPLICATE_T2V_MODEL', 'FIRELAB_REPLICATE_MUSIC_MODEL'],
  docsUrl: 'https://replicate.com/docs',
  defaultPriority: 95,
  note: 'No free tier — per-run pricing; music via meta/musicgen.',

  async isConfigured(): Promise<boolean> {
    return apiToken().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, textToVideo: true, textToMusic: true, seed: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!apiToken()) {
      checks.push({
        label: 'API token',
        ok: false,
        detail: 'REPLICATE_API_TOKEN is not set — provider stays inactive.',
      })
      return checks
    }
    checks.push({ label: 'API token', ok: true, detail: 'REPLICATE_API_TOKEN present (server-side only).' })
    try {
      const res = await fetchWithTimeout(`${BASE}/models/${imageModel()}`, {
        headers: headers(),
        timeoutMs: 15000,
      })
      checks.push({
        label: `Model exists (${imageModel()})`,
        ok: res.ok,
        detail: res.ok ? 'Model card found.' : `HTTP ${res.status} — check the model id.`,
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
    if (!apiToken()) throw new ProviderError('auth', 'REPLICATE_API_TOKEN is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const outputs = await runPrediction(imageModel(), {
        prompt: req.prompt,
        ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
        ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
        aspect_ratio: `${Math.round((width / height) * 100) / 100}`,
      })
      const { base64, mime } = await downloadBytes(outputs[0], 'image/', 60000)
      results.push({ base64, mime, width, height })
    }
    return results
  },

  async generateVideos(req: VideoGenRequest): Promise<GeneratedVideo[]> {
    if (!apiToken()) throw new ProviderError('auth', 'REPLICATE_API_TOKEN is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedVideo[] = []
    for (let i = 0; i < Math.max(1, Math.min(req.count, 2)); i++) {
      const outputs = await runPrediction(t2vModel(), {
        prompt: req.prompt,
        ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
      })
      const { base64, mime } = await downloadBytes(outputs[0], 'video/')
      results.push({ base64, mime, width, height, durationSec: req.durationSec })
    }
    return results
  },

  async generateMusic(req: MusicRequest): Promise<GeneratedAudio[]> {
    if (!apiToken()) throw new ProviderError('auth', 'REPLICATE_API_TOKEN is not configured.')
    const results: GeneratedAudio[] = []
    for (let i = 0; i < Math.max(1, Math.min(req.count, 2)); i++) {
      const outputs = await runPrediction(musicModel(), {
        prompt: req.prompt,
        duration: Math.min(Math.max(req.durationSec, 1), 120),
        output_format: 'wav',
        ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
      })
      const { base64, mime } = await downloadBytes(outputs[0], 'audio/')
      results.push({ base64, mime, durationSec: req.durationSec })
    }
    return results
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = apiToken() ? 'available' : 'not-configured'
    return [
      {
        id: imageModel(),
        label: imageModel(),
        capabilities: ['textToImage', 'seed'],
        status: st,
        source: 'replicate.com',
      },
      {
        id: t2vModel(),
        label: t2vModel(),
        capabilities: ['textToVideo'],
        status: st,
        source: 'replicate.com',
        note: 'Experimental — wan-2.1-t2v-fast, per-run pricing.',
      },
      {
        id: musicModel(),
        label: musicModel(),
        capabilities: ['textToMusic'],
        status: st,
        source: 'replicate.com',
        note: 'Meta MusicGen — WAV output.',
      },
    ]
  },
}

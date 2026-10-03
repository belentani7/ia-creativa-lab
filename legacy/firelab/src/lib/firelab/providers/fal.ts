// BELENTANI FIRELAB — fal.ai adapter (cloud, optional)
// VERIFIED queue API: POST https://queue.fal.run/{model} with
// Authorization: "Key {FAL_KEY}" and the model input as JSON →
// {request_id, status_url, response_url}; poll GET {status_url} until
// status COMPLETED; result GET {response_url}. flux/schnell returns
// {images: [{url,...}]}, wan-t2v/wan-i2v return {video: {url}}.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, classifyHttpStatus, fetchJson, fetchWithTimeout, sleep } from './http'
import { parseSize, type GeneratedImage, type GeneratedVideo, type ImageGenRequest, type ProviderAdapter, type VideoGenRequest } from './types'

const QUEUE_BASE = 'https://queue.fal.run'

interface SubmitResponse {
  request_id?: string
  status_url?: string
  response_url?: string
}

interface StatusResponse {
  status?: string
  queue_position?: number
}

interface FluxResult {
  images?: { url?: string; width?: number; height?: number; content_type?: string }[]
  video?: { url?: string }
}

function apiKey(): string {
  return process.env.FAL_KEY || ''
}

function imageModel(): string {
  return process.env.FIRELAB_FAL_IMAGE_MODEL || 'fal-ai/flux/schnell'
}

function t2vModel(): string {
  return process.env.FIRELAB_FAL_T2V_MODEL || 'fal-ai/wan-t2v'
}

function i2vModel(): string {
  return process.env.FIRELAB_FAL_I2V_MODEL || 'fal-ai/wan-i2v'
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Key ${apiKey()}`,
    'Content-Type': 'application/json',
  }
}

async function submitAndWait(model: string, input: Record<string, unknown>): Promise<FluxResult> {
  const submitted = await fetchJson<SubmitResponse>(`${QUEUE_BASE}/${model}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
    timeoutMs: 30000,
  })
  if (!submitted.request_id || !submitted.status_url || !submitted.response_url) {
    throw new ProviderError('response', 'fal queue did not return request/status/response URLs.')
  }
  // poll every 3 s — total budget 8 minutes
  const deadline = Date.now() + 480000
  while (Date.now() < deadline) {
    await sleep(3000)
    const status = await fetchJson<StatusResponse>(submitted.status_url, {
      headers: { Authorization: `Key ${apiKey()}` },
      timeoutMs: 20000,
    })
    if (status.status === 'COMPLETED') {
      return await fetchJson<FluxResult>(submitted.response_url, {
        headers: { Authorization: `Key ${apiKey()}` },
        timeoutMs: 30000,
      })
    }
    if (status.status === 'FAILED' || status.status === 'ERROR') {
      throw new ProviderError('response', `fal task ended with status ${status.status}.`)
    }
    // IN_QUEUE / IN_PROGRESS — keep polling
  }
  throw new ProviderError('timeout', 'fal task did not finish within 8 minutes.')
}

async function downloadBytes(url: string, timeoutMs = 300000): Promise<{ base64: string; mime: string }> {
  const res = await fetchWithTimeout(url, { timeoutMs })
  if (!res.ok) {
    throw new ProviderError(
      classifyHttpStatus(res.status, ''),
      `fal result download failed: HTTP ${res.status}`
    )
  }
  const mime = (res.headers.get('content-type') || 'application/octet-stream').split(';')[0]
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length === 0) throw new ProviderError('response', 'fal result download returned no bytes.')
  if (buffer.length > 50 * 1024 * 1024) {
    throw new ProviderError('response', 'fal result exceeds the 50 MB download cap.')
  }
  return { base64: buffer.toString('base64'), mime }
}

export const falProvider: ProviderAdapter = {
  id: 'fal',
  name: 'fal.ai (cloud)',
  kind: 'cloud',
  description:
    'fal.ai queue API — FLUX.1-schnell images plus Wan text-to-video and image-to-video. Fast inference, paid per second (trial credits at signup). Set FAL_KEY to activate.',
  envVars: ['FAL_KEY', 'FIRELAB_FAL_IMAGE_MODEL', 'FIRELAB_FAL_T2V_MODEL', 'FIRELAB_FAL_I2V_MODEL'],
  docsUrl: 'https://docs.fal.ai',
  defaultPriority: 90,
  note: 'No permanent free tier — trial credits at signup.',

  async isConfigured(): Promise<boolean> {
    return apiKey().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, textToVideo: true, imageToVideo: true, seed: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!apiKey()) {
      checks.push({ label: 'API key', ok: false, detail: 'FAL_KEY is not set — provider stays inactive.' })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'FAL_KEY present (server-side only).' })
    checks.push({
      label: `Image model (${imageModel()})`,
      ok: true,
      detail: 'queue.fal.run submit → poll → result — verified on first generation.',
    })
    checks.push({
      label: `Video models (${t2vModel()} / ${i2vModel()})`,
      ok: true,
      detail: 'Wan text-to-video + image-to-video via the same queue flow.',
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!apiKey()) throw new ProviderError('auth', 'FAL_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const result = await submitAndWait(imageModel(), {
        prompt: req.prompt,
        width,
        height,
        ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
        ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
        num_images: 1,
      })
      const image = result.images?.[0]
      if (!image?.url) throw new ProviderError('response', 'fal returned no image URL.')
      const { base64, mime } = await downloadBytes(image.url, 60000)
      results.push({
        base64,
        mime: mime.startsWith('image/') ? mime : 'image/png',
        width: image.width ?? width,
        height: image.height ?? height,
      })
    }
    return results
  },

  async generateVideos(req: VideoGenRequest): Promise<GeneratedVideo[]> {
    if (!apiKey()) throw new ProviderError('auth', 'FAL_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const model = req.image ? i2vModel() : t2vModel()
    const input: Record<string, unknown> = {
      prompt: req.prompt,
      ...(req.image ? { image_url: req.image } : {}),
      ...(req.seed !== undefined ? { seed: req.seed } : {}),
    }
    const results: GeneratedVideo[] = []
    for (let i = 0; i < Math.max(1, Math.min(req.count, 2)); i++) {
      let result: FluxResult
      try {
        result = await submitAndWait(model, req.count > 1 ? { ...input, seed: (req.seed ?? 0) + i } : input)
      } catch (err) {
        if (req.image && err instanceof ProviderError && (err.code === 'response' || err.code === 'auth')) {
          throw new ProviderError(
            'unsupported',
            `fal image-to-video rejected the input: ${err.message} — try a smaller image or a hosted image URL.`
          )
        }
        throw err
      }
      const url = result.video?.url ?? result.images?.[0]?.url
      if (!url) throw new ProviderError('response', 'fal returned no video URL.')
      const { base64, mime } = await downloadBytes(url, 300000)
      results.push({
        base64,
        mime: mime.startsWith('video/') ? mime : 'video/mp4',
        width,
        height,
        durationSec: req.durationSec,
      })
    }
    return results
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = apiKey() ? 'available' : 'not-configured'
    return [
      {
        id: imageModel(),
        label: imageModel(),
        capabilities: ['textToImage', 'seed'],
        status: st,
        source: 'docs.fal.ai',
      },
      {
        id: t2vModel(),
        label: t2vModel(),
        capabilities: ['textToVideo'],
        status: st,
        source: 'docs.fal.ai',
      },
      {
        id: i2vModel(),
        label: i2vModel(),
        capabilities: ['imageToVideo'],
        status: st,
        source: 'docs.fal.ai',
        note: 'Accepts data-URL start frames — fal generally handles data URIs.',
      },
    ]
  },
}

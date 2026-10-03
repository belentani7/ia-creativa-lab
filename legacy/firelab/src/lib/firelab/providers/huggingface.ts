// BELENTANI FIRELAB — Hugging Face Inference adapter (cloud, optional)
// Verified: POST https://router.huggingface.co/hf-inference/models/{model}
// with Bearer token; body {inputs, parameters:{negative_prompt,...}};
// response is raw image bytes. Monthly free credits are small — low cloud priority.
// EXPERIMENTAL: text-to-video via the same router (Wan family) — availability
// varies per region/queue; 404 is surfaced with an actionable hint.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, classifyHttpStatus, fetchWithTimeout } from './http'
import { parseSize, type GeneratedImage, type GeneratedVideo, type ImageGenRequest, type ProviderAdapter, type VideoGenRequest } from './types'

const TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || ''
const BASE = (
  process.env.FIRELAB_HF_BASE || 'https://router.huggingface.co/hf-inference/models'
).replace(/\/$/, '')
const MODEL = process.env.FIRELAB_HF_MODEL || 'stabilityai/stable-diffusion-xl-base-1.0'
const VIDEO_MODEL = process.env.FIRELAB_HF_VIDEO_MODEL || 'Wan-AI/Wan2.2-TI2V-5B'

export const huggingfaceProvider: ProviderAdapter = {
  id: 'huggingface',
  name: 'Hugging Face Inference (cloud)',
  kind: 'cloud',
  description:
    'Serverless inference for open models (SDXL, FLUX…). Small monthly free credits — recommended as the lowest-priority cloud option. Set HF_TOKEN to activate.',
  envVars: ['HF_TOKEN', 'FIRELAB_HF_MODEL', 'FIRELAB_HF_VIDEO_MODEL'],
  docsUrl: 'https://huggingface.co/docs/inference-providers/en/tasks/text-to-image',
  defaultPriority: 85,
  note: 'Experimental: video via HF router (Wan). Availability varies. Image endpoint: router.huggingface.co (the old api-inference domain is deprecated).',

  async isConfigured(): Promise<boolean> {
    return TOKEN.length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, negativePrompt: true, seed: true, textToVideo: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!TOKEN) {
      checks.push({
        label: 'API token',
        ok: false,
        detail: 'HF_TOKEN is not set — provider stays inactive.',
      })
      return checks
    }
    checks.push({ label: 'API token', ok: true, detail: 'HF_TOKEN present (server-side only).' })
    try {
      const res = await fetchWithTimeout(`https://huggingface.co/api/models/${MODEL}`, {
        timeoutMs: 15000,
      })
      checks.push({
        label: `Model exists (${MODEL})`,
        ok: res.ok,
        detail: res.ok ? 'Model card found on the Hub.' : `HTTP ${res.status} — check FIRELAB_HF_MODEL.`,
      })
    } catch (err) {
      checks.push({
        label: 'Model lookup',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    try {
      const res = await fetchWithTimeout('https://huggingface.co/api/whoami-v2', {
        headers: { Authorization: `Bearer ${TOKEN}` },
        timeoutMs: 15000,
      })
      checks.push({
        label: 'Authentication',
        ok: res.ok,
        detail: res.ok ? 'Token valid.' : `Token rejected (HTTP ${res.status}).`,
      })
    } catch (err) {
      checks.push({
        label: 'Authentication',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!TOKEN) throw new ProviderError('auth', 'HF_TOKEN is not configured.')
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < req.count; i++) {
      const res = await fetchWithTimeout(`${BASE}/${MODEL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'image/png',
        },
        body: JSON.stringify({
          inputs: req.prompt,
          parameters: {
            ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
            width: Math.min(width, 1024),
            height: Math.min(height, 1024),
            ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
          },
        }),
        timeoutMs: 180000,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const code = classifyHttpStatus(res.status, text)
        const hint =
          res.status === 503
            ? ' Model may be cold-loading — retry shortly.'
            : res.status === 404
              ? ' The hf-inference provider may not serve this model; try another model id or provider.'
              : ''
        throw new ProviderError(code, `Hugging Face returned HTTP ${res.status}.${hint} ${text.slice(0, 200)}`)
      }
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.startsWith('image/')) {
        throw new ProviderError(
          'response',
          `Hugging Face returned "${contentType}" instead of an image — quota exhausted or model unavailable.`
        )
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      results.push({
        base64: buffer.toString('base64'),
        mime: contentType.split(';')[0] || 'image/png',
        width,
        height,
      })
    }
    return results
  },

  async generateVideos(req: VideoGenRequest): Promise<GeneratedVideo[]> {
    if (!TOKEN) throw new ProviderError('auth', 'HF_TOKEN is not configured.')
    const { width, height } = parseSize(req.size)
    const res = await fetchWithTimeout(`${BASE}/${VIDEO_MODEL}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'video/mp4',
      },
      body: JSON.stringify({
        inputs: req.prompt,
        parameters: { num_frames: 48 },
      }),
      timeoutMs: 600000,
    })
    if (res.status === 404) {
      throw new ProviderError(
        'response',
        'This video model is not served by hf-inference right now — set FIRELAB_HF_VIDEO_MODEL to an available text-to-video model or rely on fal/Replicate.'
      )
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      const code = classifyHttpStatus(res.status, text)
      const hint = res.status === 503 ? ' Model may be cold-loading — retry shortly.' : ''
      throw new ProviderError(code, `Hugging Face returned HTTP ${res.status}.${hint} ${text.slice(0, 200)}`)
    }
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.startsWith('video/')) {
      throw new ProviderError(
        'response',
        `Hugging Face returned "${contentType}" instead of video bytes — model unavailable or quota exhausted. Set FIRELAB_HF_VIDEO_MODEL to an available text-to-video model or rely on fal/Replicate.`
      )
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length === 0) {
      throw new ProviderError('response', 'Hugging Face returned an empty video payload.')
    }
    return [
      {
        base64: buffer.toString('base64'),
        mime: contentType.split(';')[0] || 'video/mp4',
        width,
        height,
        durationSec: req.durationSec,
      },
    ]
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = TOKEN ? 'available' : 'not-configured'
    return [
      {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        label: 'stable-diffusion-xl-base-1.0',
        capabilities: ['textToImage', 'negativePrompt'],
        status: st,
        size: '~6.9 GB',
        license: 'OpenRAIL++-M (per model card)',
        source: 'huggingface.co',
      },
      {
        id: 'black-forest-labs/FLUX.1-schnell',
        label: 'FLUX.1-schnell',
        capabilities: ['textToImage', 'seed'],
        status: st,
        size: '~12B params',
        license: 'Apache-2.0 (per model card)',
        source: 'huggingface.co',
      },
      {
        id: VIDEO_MODEL,
        label: VIDEO_MODEL,
        capabilities: ['textToVideo'],
        status: st,
        source: 'huggingface.co',
        note: 'Experimental — availability on the HF router varies; 404 falls through with an actionable hint.',
      },
    ]
  },
}

// BELENTANI FIRELAB — Stable Diffusion WebUI adapter (local, optional)
// VERIFIED: POST {base}/sdapi/v1/txt2img {prompt, negative_prompt, width,
// height, steps, cfg_scale, seed, sampler_name, batch_size, n_iter} →
// {images: [base64 PNG]}; img2img with init_images (+mask for inpainting);
// extra-single-image for upscaling; /sdapi/v1/sd-models lists checkpoints.
// The same API is shared by A1111, Forge and SD.Next — point
// FIRELAB_A1111_URL at whichever you run. Mask-aware: uses the true alpha
// mask when provided, otherwise synthesizes one from the magenta composite.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import sharp from 'sharp'
import { ProviderError, fetchJson, fetchWithTimeout } from './http'
import { parseSize, type GeneratedImage, type ImageEditRequest, type ImageGenRequest, type ProviderAdapter } from './types'

function baseUrl(): string {
  return (process.env.FIRELAB_A1111_URL || 'http://127.0.0.1:7860').replace(/\/+$/, '')
}

interface Txt2ImgResponse {
  images?: string[]
}

interface ExtraImageResponse {
  image?: string
}

interface SdModel {
  title?: string
  model_name?: string
}

interface Upscaler {
  name?: string
}

function stripDataUrl(input: string): string {
  return input.replace(/^data:[^,]*,/, '')
}

async function probe(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${baseUrl()}/sdapi/v1/options`, { timeoutMs: 3000 })
    return res.ok
  } catch {
    return false
  }
}

/** Synthesize a black/white inpaint mask from a magenta-marker composite. */
async function maskFromMagentaComposite(pngBase64: string): Promise<string> {
  const buffer = Buffer.from(pngBase64, 'base64')
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const channels = info.channels
  const mask = Buffer.alloc(info.width * info.height)
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * channels]
    const g = data[i * channels + 1]
    const b = data[i * channels + 2]
    // magenta-ish: strong red + blue, weak green
    const isMagenta = r > 160 && b > 160 && g < Math.min(r, b) - 60
    mask[i] = isMagenta ? 255 : 0
  }
  const maskPng = await sharp(mask, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .png()
    .toBuffer()
  return maskPng.toString('base64')
}

export const a1111Provider: ProviderAdapter = {
  id: 'a1111',
  name: 'Stable Diffusion WebUI (A1111 / Forge / SD.Next)',
  kind: 'local',
  description:
    'Local Stable Diffusion WebUI API (txt2img / img2img / inpainting / upscaling). The same sdapi/v1 surface is used by A1111, Forge and SD.Next — point FIRELAB_A1111_URL at whichever you run. Supports true alpha masks, so FireLab sends the raw image + mask (no magenta guessing) when available.',
  envVars: ['FIRELAB_A1111_URL'],
  docsUrl: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API',
  defaultPriority: 12,
  note: 'Local & free — same API — point FIRELAB_A1111_URL at Forge or SD.Next.',
  activationHint: undefined,

  async isConfigured(): Promise<boolean> {
    return probe()
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return {
      textToImage: true,
      imageToImage: true,
      inpainting: true,
      outpainting: true,
      removeObject: true,
      variations: true,
      upscale: true,
      negativePrompt: true,
      seed: true,
    }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!(await probe())) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: `No WebUI detected at ${baseUrl()}. Launch it with --api (A1111/Forge) or enable the API (SD.Next).`,
      })
      return checks
    }
    checks.push({ label: 'Endpoint reachable', ok: true, detail: `${baseUrl()}/sdapi/v1 answered.` })
    try {
      const models = await fetchJson<SdModel[]>(`${baseUrl()}/sdapi/v1/sd-models`, { timeoutMs: 5000 })
      checks.push({
        label: 'Checkpoints loaded',
        ok: models.length > 0,
        detail: models.length
          ? `${models.length} checkpoint(s): ${models.slice(0, 3).map((m) => m.model_name ?? m.title).join(', ')}${models.length > 3 ? '…' : ''}`
          : 'No checkpoints — put a model in models/Stable-diffusion.',
      })
    } catch (err) {
      checks.push({
        label: 'Checkpoints loaded',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    try {
      const upscalers = await fetchJson<Upscaler[]>(`${baseUrl()}/sdapi/v1/upscalers`, { timeoutMs: 5000 })
      checks.push({
        label: 'Upscalers',
        ok: upscalers.length > 0,
        detail: upscalers.length ? `${upscalers.length} available (Lanczos used by FireLab).` : 'None.',
      })
    } catch {
      // non-fatal — upscaling just won't be offered
    }
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    const { width, height } = parseSize(req.size)
    const res = await fetchJson<Txt2ImgResponse>(`${baseUrl()}/sdapi/v1/txt2img`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: req.prompt,
        negative_prompt: req.negativePrompt ?? '',
        width,
        height,
        steps: 28,
        cfg_scale: 5,
        seed: req.seed ?? -1,
        sampler_name: 'DPM++ 2M Karras',
        batch_size: Math.min(req.count, 8),
        n_iter: 1,
      }),
      timeoutMs: 300000,
    })
    const images = res.images ?? []
    if (images.length === 0) {
      throw new ProviderError('response', 'WebUI returned no images (check its console for errors).')
    }
    return images.map((b64) => ({ base64: b64, mime: 'image/png', width, height }))
  },

  async editImage(req: ImageEditRequest): Promise<GeneratedImage[]> {
    const { width, height } = parseSize(req.size)
    const initRaw = stripDataUrl(req.rawImage ?? req.image)
    const wantsMask =
      req.mask !== undefined || /magenta|region|border areas|missing content/i.test(req.prompt)
    const isVariation = /variation/i.test(req.prompt)
    const isUpscale = /upscal|enlarge|increase resolution|higher resolution/i.test(req.prompt)

    if (isUpscale && !wantsMask) {
      // pure upscale path — no diffusion, Lanczos 2×
      const results: GeneratedImage[] = []
      for (let i = 0; i < Math.max(1, req.count); i++) {
        const res = await fetchJson<ExtraImageResponse>(`${baseUrl()}/sdapi/v1/extra-single-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            upscaler_1: 'Lanczos',
            upscaling_resize: 2,
            image: i === 0 ? initRaw : stripDataUrl(req.image),
          }),
          timeoutMs: 120000,
        })
        if (!res.image) throw new ProviderError('response', 'WebUI upscale returned no image.')
        results.push({ base64: res.image, mime: 'image/png', width: width * 2, height: height * 2 })
      }
      return results
    }

    const useMask = wantsMask
    let maskB64: string | undefined
    if (useMask) {
      maskB64 = req.mask ? stripDataUrl(req.mask) : await maskFromMagentaComposite(stripDataUrl(req.image))
    }
    const denoise = useMask ? 0.85 : isVariation ? 0.6 : 0.45

    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.max(1, Math.min(req.count, 4)); i++) {
      const body: Record<string, unknown> = {
        prompt: req.prompt,
        negative_prompt: req.negativePrompt ?? '',
        width,
        height,
        steps: 28,
        cfg_scale: 5,
        sampler_name: 'DPM++ 2M Karras',
        init_images: [initRaw],
        denoising_strength: denoise,
        seed: -1,
        batch_size: 1,
        n_iter: 1,
      }
      if (useMask) {
        body.mask = maskB64
        body.mask_blur = 4
        body.inpainting_fill = 1 // original content
        body.inpaint_full_res = false
      }
      const res = await fetchJson<Txt2ImgResponse>(`${baseUrl()}/sdapi/v1/img2img`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeoutMs: 300000,
      })
      const images = res.images ?? []
      if (images.length === 0) {
        throw new ProviderError('response', 'WebUI img2img returned no images (check its console).')
      }
      results.push({ base64: images[0], mime: 'image/png', width, height })
    }
    return results
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    if (!(await probe())) {
      return [
        {
          id: 'a1111-unavailable',
          label: 'WebUI not reachable',
          capabilities: [],
          status: 'unavailable',
          note: `Launch A1111/Forge/SD.Next with --api at ${baseUrl()} to list checkpoints.`,
        },
      ]
    }
    const out: ProviderModelInfo[] = []
    try {
      const models = await fetchJson<SdModel[]>(`${baseUrl()}/sdapi/v1/sd-models`, { timeoutMs: 8000 })
      for (const m of models) {
        out.push({
          id: m.model_name ?? m.title ?? 'unknown',
          label: m.title ?? m.model_name ?? 'unknown',
          capabilities: ['textToImage', 'imageToImage', 'inpainting', 'outpainting', 'removeObject', 'variations', 'negativePrompt', 'seed'] as Capability[],
          status: 'available',
          source: 'sdapi/v1/sd-models',
        })
      }
    } catch {
      // ignore — upscalers still listed below
    }
    try {
      const upscalers = await fetchJson<Upscaler[]>(`${baseUrl()}/sdapi/v1/upscalers`, { timeoutMs: 8000 })
      for (const u of upscalers.slice(0, 12)) {
        if (!u.name) continue
        out.push({
          id: `upscaler:${u.name}`,
          label: `Upscaler · ${u.name}`,
          capabilities: ['upscale'] as Capability[],
          status: 'available',
          source: 'sdapi/v1/upscalers',
          note: 'Upscale-only model (extra-single-image API).',
        })
      }
    } catch {
      // ignore
    }
    return out
  },
}

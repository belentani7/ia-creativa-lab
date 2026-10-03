// BELENTANI FIRELAB — Google Gemini adapter (cloud, optional)
// VERIFIED: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
// with the x-goog-api-key header. Image generation models
// (gemini-2.5-flash-image family) take {contents: [{role, parts}]} with
// generationConfig.responseModalities: ['TEXT','IMAGE'] and return
// candidates[0].content.parts — inline_data parts carry the image, text
// parts carry commentary. Editing = adding an inline_data part.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, fetchJson } from './http'
import type { EnhanceRequest, GeneratedImage, ImageEditRequest, ImageGenRequest, ProviderAdapter } from './types'
import { splitDataURL } from '../storage'

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

interface GeminiPart {
  text?: string
  inline_data?: { mime_type?: string; data?: string }
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: GeminiPart[] } }[]
  error?: { message?: string; status?: string }
}

function apiKey(): string {
  return process.env.GEMINI_API_KEY || ''
}

function imageModel(): string {
  return process.env.FIRELAB_GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
}

function textModel(): string {
  return process.env.FIRELAB_GEMINI_TEXT_MODEL || 'gemini-2.5-flash'
}

function generateUrl(model: string): string {
  return `${BASE}/${model}:generateContent`
}

function headers(): Record<string, string> {
  return {
    'x-goog-api-key': apiKey(),
    'Content-Type': 'application/json',
  }
}

function extractImage(res: GenerateContentResponse): { base64: string; mime: string } {
  const parts = res.candidates?.[0]?.content?.parts ?? []
  const imagePart = parts.find((p) => p.inline_data?.data)
  if (!imagePart?.inline_data?.data) {
    const text = parts
      .map((p) => p.text)
      .filter(Boolean)
      .join(' ')
      .slice(0, 200)
    throw new ProviderError(
      'response',
      text
        ? `Gemini returned text instead of an image: "${text}"`
        : 'Gemini returned no image data (safety filter, quota, or model issue).'
    )
  }
  return {
    base64: imagePart.inline_data.data,
    mime: imagePart.inline_data.mime_type || 'image/png',
  }
}

export const geminiProvider: ProviderAdapter = {
  id: 'gemini',
  name: 'Google Gemini (AI Studio, cloud)',
  kind: 'cloud',
  description:
    'Gemini image generation (gemini-2.5-flash-image family — the nano banana successor) and text models for prompt enhancement, both via the generateContent REST surface. Set GEMINI_API_KEY to activate.',
  envVars: ['GEMINI_API_KEY', 'FIRELAB_GEMINI_IMAGE_MODEL', 'FIRELAB_GEMINI_TEXT_MODEL'],
  docsUrl: 'https://ai.google.dev',
  defaultPriority: 60,
  note: 'Free tier limits vary (~100–500 img/day) — check AI Studio.',

  async isConfigured(): Promise<boolean> {
    return apiKey().length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, imageToImage: true, promptEnhance: true, seed: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!apiKey()) {
      checks.push({ label: 'API key', ok: false, detail: 'GEMINI_API_KEY is not set — provider stays inactive.' })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'GEMINI_API_KEY present (server-side only).' })
    try {
      const res = await fetchJson<GenerateContentResponse>(generateUrl(textModel()), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Reply with the single word OK.' }] }],
        }),
        timeoutMs: 30000,
      })
      const ok = (res.candidates?.length ?? 0) > 0
      checks.push({
        label: 'Authentication',
        ok,
        detail: ok
          ? 'Key accepted by generativelanguage.googleapis.com.'
          : res.error?.message ?? 'Key rejected or model unavailable.',
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
      detail: 'generateContent with TEXT+IMAGE modalities — verified on first generation.',
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!apiKey()) throw new ProviderError('auth', 'GEMINI_API_KEY is not configured.')
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const res = await fetchJson<GenerateContentResponse>(generateUrl(imageModel()), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: req.negativePrompt ? `${req.prompt}. Avoid: ${req.negativePrompt}` : req.prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            ...(req.seed !== undefined ? { seed: req.seed + i } : {}),
          },
        }),
        timeoutMs: 120000,
      })
      const { base64, mime } = extractImage(res)
      results.push({ base64, mime, width: 1024, height: 1024 })
    }
    return results
  },

  async editImage(req: ImageEditRequest): Promise<GeneratedImage[]> {
    if (!apiKey()) throw new ProviderError('auth', 'GEMINI_API_KEY is not configured.')
    let inline: { mime: string; base64: string }
    try {
      inline = splitDataURL(req.image)
    } catch {
      throw new ProviderError('unsupported', 'Gemini editing needs a data-URL image.')
    }
    const results: GeneratedImage[] = []
    for (let i = 0; i < Math.min(req.count, 4); i++) {
      const res = await fetchJson<GenerateContentResponse>(generateUrl(imageModel()), {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: req.prompt },
                { inline_data: { mime_type: inline.mime, data: inline.base64 } },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
        timeoutMs: 120000,
      })
      const { base64, mime } = extractImage(res)
      results.push({ base64, mime, width: 1024, height: 1024 })
    }
    return results
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    if (!apiKey()) throw new ProviderError('auth', 'GEMINI_API_KEY is not configured.')
    const res = await fetchJson<GenerateContentResponse>(generateUrl(textModel()), {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: ENHANCE_SYSTEM_PROMPT }] },
          { role: 'user', parts: [{ text: req.prompt }] },
        ],
      }),
      timeoutMs: 60000,
    })
    const parts = res.candidates?.[0]?.content?.parts ?? []
    const content = parts
      .map((p) => p.text)
      .filter(Boolean)
      .join(' ')
      .trim()
    if (!content) throw new ProviderError('response', 'Gemini returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const st: 'available' | 'not-configured' = apiKey() ? 'available' : 'not-configured'
    return [
      {
        id: imageModel(),
        label: imageModel(),
        capabilities: ['textToImage', 'imageToImage', 'seed'],
        status: st,
        source: 'ai.google.dev',
        note: 'Image generation via generateContent (TEXT+IMAGE modalities).',
      },
      {
        id: textModel(),
        label: textModel(),
        capabilities: ['promptEnhance'],
        status: st,
        source: 'ai.google.dev',
        note: 'Text model — prompt enhancement.',
      },
    ]
  },
}

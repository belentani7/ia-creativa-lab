// BELENTANI FIRELAB — Qwen / Alibaba DashScope adapter (cloud, optional)
// Verified: POST /api/v1/services/aigc/text2image/image-synthesis with
// Authorization: Bearer + X-DashScope-Async: enable, async task polling via
// GET /api/v1/tasks/{task_id}. Sizes use "W*H". Negative prompt supported.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, classifyHttpStatus, fetchJson, fetchWithTimeout, sleep } from './http'
import { parseSize, type EnhanceRequest, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const API_KEY = process.env.DASHSCOPE_API_KEY || ''
const BASE = process.env.FIRELAB_QWEN_BASE || 'https://dashscope-intl.aliyuncs.com'
const IMAGE_MODEL = process.env.FIRELAB_QWEN_IMAGE_MODEL || 'wanx2.1-t2i-turbo'
const TEXT_MODEL = process.env.FIRELAB_QWEN_TEXT_MODEL || 'qwen-plus'

interface SubmitResponse {
  output?: { task_id?: string; task_status?: string; message?: string; code?: string }
  code?: string
  message?: string
}

interface TaskResponse {
  output?: {
    task_status?: string
    results?: { url?: string }[]
    message?: string
    code?: string
  }
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

async function fetchImageBytes(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetchWithTimeout(url, { timeoutMs: 60000 })
  if (!res.ok) {
    throw new ProviderError(classifyHttpStatus(res.status, ''), `Failed to download result: HTTP ${res.status}`)
  }
  const mime = res.headers.get('content-type') || 'image/png'
  const buffer = Buffer.from(await res.arrayBuffer())
  return { base64: buffer.toString('base64'), mime }
}

export const qwenProvider: ProviderAdapter = {
  id: 'qwen',
  name: 'Qwen · DashScope (cloud)',
  kind: 'cloud',
  description:
    'Alibaba Model Studio image generation (wanx / qwen-image models) with a free quota for new accounts. Optional — only used when you set DASHSCOPE_API_KEY.',
  envVars: ['DASHSCOPE_API_KEY', 'FIRELAB_QWEN_BASE', 'FIRELAB_QWEN_IMAGE_MODEL', 'FIRELAB_QWEN_TEXT_MODEL'],
  docsUrl: 'https://www.alibabacloud.com/help/en/model-studio/text-to-image-v2-api-reference',
  defaultPriority: 50,
  note: 'Free quota for new users (amount varies — check Model Studio console).',

  async isConfigured(): Promise<boolean> {
    return API_KEY.length > 0
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, negativePrompt: true, seed: true, promptEnhance: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!API_KEY) {
      checks.push({
        label: 'API key',
        ok: false,
        detail: 'DASHSCOPE_API_KEY is not set — provider stays inactive.',
      })
      return checks
    }
    checks.push({ label: 'API key', ok: true, detail: 'DASHSCOPE_API_KEY present (server-side only).' })
    try {
      // cheap authenticated call: OpenAI-compatible model listing
      const res = await fetchWithTimeout(`${BASE}/compatible-mode/v1/models`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeoutMs: 15000,
      })
      if (res.ok) {
        checks.push({ label: 'Authentication', ok: true, detail: `Key accepted by ${BASE}.` })
      } else if (res.status === 401 || res.status === 403) {
        checks.push({ label: 'Authentication', ok: false, detail: `Key rejected (HTTP ${res.status}).` })
      } else {
        checks.push({
          label: 'Authentication',
          ok: false,
          detail: `Unexpected HTTP ${res.status} — the shared dashscope domains are legacy; you may need your workspace-dedicated maas.aliyuncs.com base in FIRELAB_QWEN_BASE.`,
        })
      }
    } catch (err) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    checks.push({
      label: `Image model (${IMAGE_MODEL})`,
      ok: true,
      detail: 'Verified on first generation — model availability depends on your account.',
    })
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    if (!API_KEY) throw new ProviderError('auth', 'DASHSCOPE_API_KEY is not configured.')
    const { width, height } = parseSize(req.size)
    const submit = await fetchJson<SubmitResponse>(
      `${BASE}/api/v1/services/aigc/text2image/image-synthesis`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          input: {
            prompt: req.prompt,
            ...(req.negativePrompt ? { negative_prompt: req.negativePrompt } : {}),
          },
          parameters: { n: Math.min(req.count, 4), size: `${width}*${height}` },
        }),
        timeoutMs: 30000,
      }
    )
    const taskId = submit.output?.task_id
    if (!taskId) {
      throw new ProviderError(
        'response',
        submit.message || submit.output?.message || 'DashScope did not return a task id.'
      )
    }
    const deadline = Date.now() + 240000
    while (Date.now() < deadline) {
      await sleep(2500)
      const task = await fetchJson<TaskResponse>(`${BASE}/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
        timeoutMs: 20000,
      })
      const status = task.output?.task_status
      if (status === 'SUCCEEDED') {
        const urls = (task.output?.results ?? [])
          .map((r) => r.url)
          .filter((u): u is string => typeof u === 'string' && u.length > 0)
        if (urls.length === 0) throw new ProviderError('response', 'Task succeeded but returned no images.')
        const images = await Promise.all(urls.map(fetchImageBytes))
        return images.map((img) => ({ ...img, width, height }))
      }
      if (status === 'FAILED' || status === 'CANCELED' || status === 'UNKNOWN') {
        throw new ProviderError(
          'response',
          task.output?.message || `DashScope task ended with status ${status}.`
        )
      }
    }
    throw new ProviderError('timeout', 'DashScope task did not finish in time.')
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    if (!API_KEY) throw new ProviderError('auth', 'DASHSCOPE_API_KEY is not configured.')
    const res = await fetchJson<ChatResponse>(`${BASE}/compatible-mode/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [
          { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
          { role: 'user', content: req.prompt },
        ],
      }),
      timeoutMs: 60000,
    })
    const content = res.choices?.[0]?.message?.content?.trim()
    if (!content) throw new ProviderError('response', 'DashScope returned an empty completion.')
    return content
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const configured = API_KEY.length > 0
    const st: 'available' | 'not-configured' = configured ? 'available' : 'not-configured'
    return [
      {
        id: 'wanx2.1-t2i-turbo',
        label: 'wanx2.1-t2i-turbo',
        capabilities: ['textToImage', 'negativePrompt'],
        status: st,
        note: 'Default. Accelerated generation, free quota for new users.',
        source: 'Alibaba Model Studio',
      },
      {
        id: 'wanx2.1-t2i-plus',
        label: 'wanx2.1-t2i-plus',
        capabilities: ['textToImage', 'negativePrompt'],
        status: st,
        note: 'Higher quality tier.',
        source: 'Alibaba Model Studio',
      },
      {
        id: 'qwen-image',
        label: 'qwen-image',
        capabilities: ['textToImage', 'negativePrompt'],
        status: st,
        note: 'Qwen image model (API). Its open-source sibling Qwen-Image (Apache-2.0) runs locally in ComfyUI.',
        source: 'Alibaba Model Studio',
      },
    ]
  },
}

// BELENTANI FIRELAB — ComfyUI adapter (local diffusion runtime, optional)
// Verified endpoints: GET /system_stats · POST /prompt · GET /history/{id} ·
// GET /view?filename=&subfolder=&type= · GET /object_info/{node}
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, fetchJson, fetchWithTimeout, sleep } from './http'
import { parseSize, type GeneratedImage, type ImageGenRequest, type ProviderAdapter } from './types'

const COMFY_BASE = process.env.FIRELAB_COMFYUI_URL || 'http://127.0.0.1:8188'
const CHECKPOINT = process.env.FIRELAB_COMFY_MODEL || ''

interface SystemStats {
  system?: { os?: string; ram_total?: number }
  devices?: { name: string; type: string; vram_total?: number }[]
}

interface PromptResponse {
  prompt_id: string
}

interface HistoryResponse {
  [promptId: string]: {
    status?: { completed?: boolean; status_str?: string }
    outputs?: {
      [nodeId: string]: { images?: { filename: string; subfolder?: string; type?: string }[] }
    }
  }
}

interface ObjectInfoResponse {
  CheckpointLoaderSimple?: {
    input?: { required?: { checkpoint_name?: [string[]] } }
  }
}

async function probe(): Promise<SystemStats | null> {
  try {
    return await fetchJson<SystemStats>(`${COMFY_BASE}/system_stats`, { timeoutMs: 1500 })
  } catch {
    return null
  }
}

async function listCheckpoints(): Promise<string[]> {
  try {
    const info = await fetchJson<ObjectInfoResponse>(
      `${COMFY_BASE}/object_info/CheckpointLoaderSimple`,
      { timeoutMs: 3000 }
    )
    return info.CheckpointLoaderSimple?.input?.required?.checkpoint_name?.[0] ?? []
  } catch {
    return []
  }
}

function buildWorkflow(opts: {
  checkpoint: string
  positive: string
  negative: string
  width: number
  height: number
  seed: number
}) {
  return {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { checkpoint_name: opts.checkpoint } },
    '2': { class_type: 'CLIPTextEncode', inputs: { text: opts.positive, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode', inputs: { text: opts.negative, clip: ['1', 1] } },
    '4': {
      class_type: 'EmptyLatentImage',
      inputs: { width: opts.width, height: opts.height, batch_size: 1 },
    },
    '5': {
      class_type: 'KSampler',
      inputs: {
        seed: opts.seed,
        steps: 28,
        cfg: 7,
        sampler_name: 'euler',
        scheduler: 'normal',
        denoise: 1,
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['3', 0],
        latent_image: ['4', 0],
      },
    },
    '6': { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] } },
    '7': { class_type: 'SaveImage', inputs: { images: ['6', 0], filename_prefix: 'firelab' } },
  }
}

async function runWorkflow(workflow: Record<string, unknown>, timeoutMs = 240000) {
  const submitted = await fetchJson<PromptResponse>(`${COMFY_BASE}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: workflow,
      client_id: `firelab-${Math.random().toString(36).slice(2)}`,
    }),
    timeoutMs: 20000,
  })
  const promptId = submitted.prompt_id
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(1200)
    const history = await fetchJson<HistoryResponse>(`${COMFY_BASE}/history/${promptId}`, {
      timeoutMs: 10000,
    })
    const entry = history[promptId]
    if (!entry) continue
    const images = entry.outputs?.['7']?.images
    if (images && images.length > 0) return images
    if (entry.status?.status_str === 'error') {
      throw new ProviderError('response', 'ComfyUI reported a workflow execution error.')
    }
  }
  throw new ProviderError('timeout', 'ComfyUI workflow did not finish in time.')
}

async function fetchView(image: { filename: string; subfolder?: string; type?: string }) {
  const params = new URLSearchParams({
    filename: image.filename,
    subfolder: image.subfolder ?? '',
    type: image.type ?? 'output',
  })
  const res = await fetchWithTimeout(`${COMFY_BASE}/view?${params.toString()}`, { timeoutMs: 30000 })
  if (!res.ok) throw new ProviderError('response', `ComfyUI /view failed: HTTP ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  return { base64: buffer.toString('base64'), mime: 'image/png' }
}

export const comfyProvider: ProviderAdapter = {
  id: 'comfyui',
  name: 'ComfyUI (local diffusion)',
  kind: 'local',
  description:
    'Optional local diffusion runtime. Runs open-source checkpoints (SDXL, Qwen-Image, FLUX…) entirely on your GPU — no API key, no quota. Set the checkpoint in the environment or it uses the first one loaded.',
  envVars: ['FIRELAB_COMFYUI_URL', 'FIRELAB_COMFY_MODEL'],
  docsUrl: 'https://docs.comfy.org/',
  defaultPriority: 14,
  note: 'Local & open-source. Detected automatically when ComfyUI is running.',

  async isConfigured(): Promise<boolean> {
    return (await probe()) !== null
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { textToImage: true, negativePrompt: true, seed: true, promptEnhance: false }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    const stats = await probe()
    if (!stats) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: `No ComfyUI detected at ${COMFY_BASE}. Launch it (default port 8188, desktop default 8000).`,
      })
      return checks
    }
    const gpu = stats.devices?.[0]
    checks.push({
      label: 'Endpoint reachable',
      ok: true,
      detail: `${COMFY_BASE} — ComfyUI server responded.`,
    })
    checks.push({
      label: 'Compute device',
      ok: true,
      detail: gpu ? `${gpu.name} (${gpu.type}${gpu.vram_total ? `, ${(gpu.vram_total / 1e9).toFixed(1)} GB VRAM` : ''})` : 'CPU-only.',
    })
    const checkpoints = await listCheckpoints()
    checks.push({
      label: 'Checkpoints available',
      ok: checkpoints.length > 0,
      detail: checkpoints.length
        ? `${checkpoints.length} checkpoint(s): ${checkpoints.slice(0, 3).join(', ')}${checkpoints.length > 3 ? '…' : ''}`
        : 'No checkpoints in models/checkpoints.',
    })
    if (CHECKPOINT) {
      checks.push({
        label: `Configured checkpoint (${CHECKPOINT})`,
        ok: checkpoints.includes(CHECKPOINT),
        detail: checkpoints.includes(CHECKPOINT)
          ? 'Found.'
          : 'Not found in ComfyUI — check FIRELAB_COMFY_MODEL.',
      })
    }
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    const stats = await probe()
    if (!stats) throw new ProviderError('network', `ComfyUI is not reachable at ${COMFY_BASE}`)
    let checkpoint = CHECKPOINT
    if (!checkpoint) {
      const checkpoints = await listCheckpoints()
      if (checkpoints.length === 0) {
        throw new ProviderError(
          'response',
          'ComfyUI has no checkpoints loaded. Place a model in models/checkpoints or set FIRELAB_COMFY_MODEL.'
        )
      }
      checkpoint = checkpoints[0]
    }
    const { width, height } = parseSize(req.size)
    const results: GeneratedImage[] = []
    for (let i = 0; i < req.count; i++) {
      const workflow = buildWorkflow({
        checkpoint,
        positive: req.prompt,
        negative: req.negativePrompt ?? '',
        width,
        height,
        seed: (req.seed ?? Math.floor(Math.random() * 1e9)) + i,
      })
      const images = await runWorkflow(workflow)
      const fetched = await fetchView(images[0])
      results.push({ ...fetched, width, height })
    }
    return results
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    const stats = await probe()
    if (!stats) {
      return [
        {
          id: 'comfyui-unavailable',
          label: 'ComfyUI not reachable',
          capabilities: [],
          status: 'unavailable',
          note: `Launch ComfyUI at ${COMFY_BASE} to list checkpoints.`,
        },
      ]
    }
    const checkpoints = await listCheckpoints()
    if (checkpoints.length === 0) {
      return [
        {
          id: 'comfyui-empty',
          label: 'No checkpoints loaded',
          capabilities: [],
          status: 'unavailable',
          note: 'Add models to ComfyUI models/checkpoints (e.g. SDXL, Qwen-Image — Apache-2.0).',
        },
      ]
    }
    return checkpoints.map((name) => ({
      id: name,
      label: name,
      capabilities: ['textToImage', 'negativePrompt', 'seed'] as Capability[],
      status: 'available' as const,
      source: 'ComfyUI models/checkpoints',
      note: name === CHECKPOINT ? 'Active checkpoint (FIRELAB_COMFY_MODEL).' : undefined,
    }))
  },
}

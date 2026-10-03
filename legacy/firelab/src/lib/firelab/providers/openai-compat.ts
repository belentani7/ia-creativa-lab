// BELENTANI FIRELAB — local OpenAI-compatible LLM servers (factory, optional)
// VERIFIED: GET {base}/models lists served models; POST {base}/chat/completions
// with {model, messages, temperature} is the shared surface. One factory
// produces all seven adapters: LM Studio, llama.cpp server, Jan, KoboldCpp,
// vLLM, LocalAI and text-generation-webui. Nothing leaves your machine.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, fetchJson, fetchWithTimeout } from './http'
import type { EnhanceRequest, ProviderAdapter } from './types'

interface ModelsResponse {
  data?: { id?: string }[]
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

export interface LocalLlmOptions {
  id: string
  name: string
  urlEnv: string
  defaultUrl: string
  docsUrl: string
  note: string
  defaultPriority: number
}

function makeLocalLlm(opts: LocalLlmOptions): ProviderAdapter {
  const baseUrl = () => (process.env[opts.urlEnv] || opts.defaultUrl).replace(/\/+$/, '')
  const modelEnv = `FIRELAB_${opts.id.toUpperCase().replace(/-/g, '_')}_MODEL`

  async function probeModels(): Promise<ModelsResponse | null> {
    try {
      return await fetchJson<ModelsResponse>(`${baseUrl()}/models`, { timeoutMs: 3000 })
    } catch {
      return null
    }
  }

  async function pickModel(): Promise<string> {
    const env = process.env[modelEnv]
    if (env) return env
    const models = await probeModels()
    const first = models?.data?.find((m) => m.id)?.id
    return first || 'local-model'
  }

  return {
    id: opts.id,
    name: opts.name,
    kind: 'local',
    description: `${opts.name} — local OpenAI-compatible chat server used for prompt enhancement. Auto-detected when the server is running at ${opts.defaultUrl} (override with ${opts.urlEnv}). Nothing leaves your machine.`,
    envVars: [opts.urlEnv, modelEnv],
    docsUrl: opts.docsUrl,
    defaultPriority: opts.defaultPriority,
    note: opts.note,
    activationHint: undefined,

    async isConfigured(): Promise<boolean> {
      return (await probeModels()) !== null
    },

    capabilities(): Partial<Record<Capability, boolean>> {
      return { promptEnhance: true }
    },

    async testConnection(): Promise<DiagnosticCheck[]> {
      const checks: DiagnosticCheck[] = []
      const models = await probeModels()
      if (!models) {
        checks.push({
          label: 'Endpoint reachable',
          ok: false,
          detail: `No server detected at ${baseUrl()} (${opts.urlEnv}). ${opts.note}`,
        })
        return checks
      }
      checks.push({ label: 'Endpoint reachable', ok: true, detail: `${baseUrl()}/models responded.` })
      const ids = (models.data ?? [])
        .map((m) => m.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
      checks.push({
        label: 'Models served',
        ok: ids.length > 0,
        detail: ids.length
          ? `${ids.length} model(s): ${ids.slice(0, 4).join(', ')}${ids.length > 4 ? '…' : ''}`
          : 'No models loaded — load one in the server app.',
      })
      checks.push({
        label: 'Chat completions',
        ok: true,
        detail: `POST ${baseUrl()}/chat/completions — verified on first enhancement.`,
      })
      return checks
    },

    async enhancePrompt(req: EnhanceRequest): Promise<string> {
      const model = await pickModel()
      const res = await fetchJson<ChatResponse>(`${baseUrl()}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
            { role: 'user', content: req.prompt },
          ],
          temperature: 0.7,
        }),
        timeoutMs: 120000,
      })
      const content = res.choices?.[0]?.message?.content?.trim()
      if (!content) {
        throw new ProviderError('response', `${opts.name} returned an empty completion.`)
      }
      return content
    },

    async listModels(): Promise<ProviderModelInfo[]> {
      const models = await probeModels()
      if (!models) {
        return [
          {
            id: `${opts.id}-unavailable`,
            label: `${opts.name} not reachable`,
            capabilities: [],
            status: 'unavailable',
            note: `Start the server at ${baseUrl()} to list models.`,
          },
        ]
      }
      const ids = (models.data ?? [])
        .map((m) => m.id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
      if (ids.length === 0) {
        return [
          {
            id: `${opts.id}-empty`,
            label: 'No models loaded',
            capabilities: [],
            status: 'unavailable',
            note: 'Load a model in the server, then it appears here.',
          },
        ]
      }
      return ids.map((id) => ({
        id,
        label: id,
        capabilities: ['promptEnhance'] as Capability[],
        status: 'available' as const,
        source: opts.name,
      }))
    },
  }
}

export const lmstudioProvider = makeLocalLlm({
  id: 'lmstudio',
  name: 'LM Studio (local)',
  urlEnv: 'FIRELAB_LMSTUDIO_URL',
  defaultUrl: 'http://127.0.0.1:1234/v1',
  docsUrl: 'https://lmstudio.ai/docs/app/api',
  note: 'Run the local server from the LM Studio app.',
  defaultPriority: 20,
})

export const llamacppProvider = makeLocalLlm({
  id: 'llamacpp',
  name: 'llama.cpp llama-server (local)',
  urlEnv: 'FIRELAB_LLAMACPP_URL',
  defaultUrl: 'http://127.0.0.1:8080/v1',
  docsUrl: 'https://github.com/ggml-org/llama.cpp',
  note: 'Start with `llama-server`.',
  defaultPriority: 22,
})

export const janProvider = makeLocalLlm({
  id: 'jan',
  name: 'Jan (local)',
  urlEnv: 'FIRELAB_JAN_URL',
  defaultUrl: 'http://127.0.0.1:1337/v1',
  docsUrl: 'https://jan.ai/docs/api',
  note: 'Enable the local API server in Jan settings.',
  defaultPriority: 24,
})

export const koboldcppProvider = makeLocalLlm({
  id: 'koboldcpp',
  name: 'KoboldCpp (local)',
  urlEnv: 'FIRELAB_KOBOLDCPP_URL',
  defaultUrl: 'http://127.0.0.1:5001/v1',
  docsUrl: 'https://github.com/LostRuins/koboldcpp',
  note: 'OpenAI-compatible API must be enabled.',
  defaultPriority: 26,
})

export const vllmProvider = makeLocalLlm({
  id: 'vllm',
  name: 'vLLM (local)',
  urlEnv: 'FIRELAB_VLLM_URL',
  defaultUrl: 'http://127.0.0.1:8000/v1',
  docsUrl: 'https://docs.vllm.ai',
  note: 'Serves any Hugging Face model with an OpenAI-compatible API.',
  defaultPriority: 28,
})

export const localaiProvider = makeLocalLlm({
  id: 'localai',
  name: 'LocalAI (local)',
  urlEnv: 'FIRELAB_LOCALAI_URL',
  defaultUrl: 'http://127.0.0.1:8080/v1',
  docsUrl: 'https://localai.io',
  note: 'Also serves image models if configured — text used here.',
  defaultPriority: 30,
})

export const textgenwebuiProvider = makeLocalLlm({
  id: 'textgenwebui',
  name: 'text-generation-webui (local)',
  urlEnv: 'FIRELAB_TEXTGENWEBUI_URL',
  defaultUrl: 'http://127.0.0.1:5000/v1',
  docsUrl: 'https://github.com/oobabooga/text-generation-webui',
  note: 'Start with --api and the OpenAI extension.',
  defaultPriority: 32,
})

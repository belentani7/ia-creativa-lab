// BELENTANI FIRELAB — cloud chat-completion LLMs (factory, optional)
// All five speak the OpenAI shape: POST {base}/chat/completions with a Bearer
// key; GET {base}/models lists models where the endpoint is free to call.
// Used for prompt enhancement only. Keys are read server-side only.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT } from '../prompt'
import { ProviderError, fetchJson } from './http'
import type { EnhanceRequest, ProviderAdapter } from './types'

interface ModelsResponse {
  data?: { id?: string }[]
}

interface ChatResponse {
  choices?: { message?: { content?: string } }[]
}

export interface CloudLlmOptions {
  id: string
  name: string
  base: string
  keyEnv: string
  modelEnv: string
  defaultModel?: string
  docsUrl: string
  note: string
  defaultPriority: number
  /** OpenRouter picks a ":free" model from the catalog when no env model set. */
  pickFreeModel?: boolean
}

function makeCloudLlm(opts: CloudLlmOptions): ProviderAdapter {
  const apiKey = () => process.env[opts.keyEnv] || ''
  const baseUrl = () => opts.base.replace(/\/+$/, '')
  const modelEnv = opts.modelEnv

  async function listRemoteModels(): Promise<ModelsResponse | null> {
    if (!apiKey()) return null
    try {
      return await fetchJson<ModelsResponse>(`${baseUrl()}/models`, {
        headers: { Authorization: `Bearer ${apiKey()}` },
        timeoutMs: 15000,
      })
    } catch {
      return null
    }
  }

  async function pickModel(): Promise<string> {
    const env = process.env[modelEnv]
    if (env) return env
    if (opts.defaultModel) return opts.defaultModel
    const models = await listRemoteModels()
    const ids = (models?.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
    if (ids.length === 0) {
      throw new ProviderError('response', `${opts.name}: no models listed — set ${modelEnv}.`)
    }
    if (opts.pickFreeModel) {
      const free = ids.find((id) => id.endsWith(':free'))
      if (free) return free
    }
    return ids[0]
  }

  return {
    id: opts.id,
    name: opts.name,
    kind: 'cloud',
    description: `${opts.name} — OpenAI-compatible chat endpoint used for prompt enhancement. Optional: set ${opts.keyEnv} to activate.`,
    envVars: [opts.keyEnv, modelEnv],
    docsUrl: opts.docsUrl,
    defaultPriority: opts.defaultPriority,
    note: opts.note,

    async isConfigured(): Promise<boolean> {
      return apiKey().length > 0
    },

    capabilities(): Partial<Record<Capability, boolean>> {
      return { promptEnhance: true }
    },

    async testConnection(): Promise<DiagnosticCheck[]> {
      const checks: DiagnosticCheck[] = []
      if (!apiKey()) {
        checks.push({
          label: 'API key',
          ok: false,
          detail: `${opts.keyEnv} is not set — provider stays inactive.`,
        })
        return checks
      }
      checks.push({ label: 'API key', ok: true, detail: `${opts.keyEnv} present (server-side only).` })
      const models = await listRemoteModels()
      checks.push({
        label: 'Authentication',
        ok: models !== null,
        detail:
          models !== null
            ? `Key accepted by ${baseUrl()}.`
            : `Key rejected or ${baseUrl()}/models unavailable — check ${opts.keyEnv}.`,
      })
      checks.push({
        label: 'Model',
        ok: true,
        detail: `Uses ${process.env[modelEnv] ?? opts.defaultModel ?? 'first model from /models'}. Set ${modelEnv} to override.`,
      })
      return checks
    },

    async enhancePrompt(req: EnhanceRequest): Promise<string> {
      if (!apiKey()) throw new ProviderError('auth', `${opts.keyEnv} is not configured.`)
      const model = await pickModel()
      const res = await fetchJson<ChatResponse>(`${baseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: ENHANCE_SYSTEM_PROMPT },
            { role: 'user', content: req.prompt },
          ],
          temperature: 0.7,
        }),
        timeoutMs: 60000,
      })
      const content = res.choices?.[0]?.message?.content?.trim()
      if (!content) throw new ProviderError('response', `${opts.name} returned an empty completion.`)
      return content
    },

    async listModels(): Promise<ProviderModelInfo[]> {
      const st: 'available' | 'not-configured' = apiKey() ? 'available' : 'not-configured'
      const models = await listRemoteModels()
      const ids = (models?.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      const configured = process.env[modelEnv] ?? opts.defaultModel
      const out: ProviderModelInfo[] = ids.slice(0, 24).map((id) => ({
        id,
        label: id,
        capabilities: ['promptEnhance'] as Capability[],
        status: st,
        source: opts.name,
      }))
      if (configured) {
        out.unshift({
          id: configured,
          label: `${configured} (active)`,
          capabilities: ['promptEnhance'],
          status: st,
          source: `${opts.name} · ${modelEnv}`,
        })
      }
      if (out.length === 0) {
        out.push({
          id: `${opts.id}-setmodel`,
          label: 'Set model manually',
          capabilities: ['promptEnhance'],
          status: st,
          note: `Model catalog unavailable — set ${modelEnv} directly.`,
          source: opts.name,
        })
      }
      return out
    },
  }
}

export const groqProvider = makeCloudLlm({
  id: 'groq',
  name: 'Groq (cloud)',
  base: 'https://api.groq.com/openai/v1',
  keyEnv: 'GROQ_API_KEY',
  modelEnv: 'FIRELAB_GROQ_TEXT_MODEL',
  docsUrl: 'https://console.groq.com',
  note: 'Free tier with per-model daily limits.',
  defaultPriority: 100,
})

export const mistralProvider = makeCloudLlm({
  id: 'mistral',
  name: 'Mistral La Plateforme (cloud)',
  base: 'https://api.mistral.ai/v1',
  keyEnv: 'MISTRAL_API_KEY',
  modelEnv: 'FIRELAB_MISTRAL_TEXT_MODEL',
  defaultModel: 'mistral-small-latest',
  docsUrl: 'https://docs.mistral.ai',
  note: 'Free experiment plan with monthly usage.',
  defaultPriority: 105,
})

export const deepseekProvider = makeCloudLlm({
  id: 'deepseek',
  name: 'DeepSeek (cloud)',
  base: 'https://api.deepseek.com/v1',
  keyEnv: 'DEEPSEEK_API_KEY',
  modelEnv: 'FIRELAB_DEEPSEEK_TEXT_MODEL',
  defaultModel: 'deepseek-chat',
  docsUrl: 'https://api-docs.deepseek.com',
  note: 'Pay-per-token (cheap), no permanent free tier.',
  defaultPriority: 110,
})

export const cerebrasProvider = makeCloudLlm({
  id: 'cerebras',
  name: 'Cerebras (cloud)',
  base: 'https://api.cerebras.ai/v1',
  keyEnv: 'CEREBRAS_API_KEY',
  modelEnv: 'FIRELAB_CEREBRAS_TEXT_MODEL',
  docsUrl: 'https://cloud.cerebras.ai',
  note: 'Free tier ~1M tokens/day (unofficial).',
  defaultPriority: 115,
})

export const openrouterProvider = makeCloudLlm({
  id: 'openrouter',
  name: 'OpenRouter (cloud)',
  base: 'https://openrouter.ai/api/v1',
  keyEnv: 'OPENROUTER_API_KEY',
  modelEnv: 'FIRELAB_OPENROUTER_MODEL',
  docsUrl: 'https://openrouter.ai/docs',
  note: '19 models with ":free" suffix at last check — 50 free requests/day. Set FIRELAB_OPENROUTER_MODEL (e.g. a :free model) or the first :free model found in /models is used.',
  defaultPriority: 120,
  pickFreeModel: true,
})

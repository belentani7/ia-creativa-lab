// BELENTANI FIRELAB — Provider Manager (server only)
// Registry + capability-aware selection + automatic fallback.
// CLOUD IS OPTIONAL. LOCAL IS FIRST. PROVIDERS ARE PLUGINS.
import type { Capability, FallbackEvent, ProviderInfo, ProviderTestResult } from '../types'
import { readConfig, writeConfig } from '../storage'
import type {
  EnhanceRequest,
  GeneratedAudio,
  GeneratedImage,
  GeneratedVideo,
  ImageEditRequest,
  ImageGenRequest,
  ImageSearchResult,
  MusicRequest,
  ProviderAdapter,
  SpeechRequest,
  TranscriptionRequest,
  VideoGenRequest,
} from './types'
import { ProviderError } from './http'
import { builtinProvider } from './builtin'
import { a1111Provider } from './a1111'
import { comfyProvider } from './comfyui'
import { ollamaProvider } from './ollama'
import { whispercppProvider } from './whispercpp'
import {
  janProvider,
  koboldcppProvider,
  llamacppProvider,
  lmstudioProvider,
  localaiProvider,
  textgenwebuiProvider,
  vllmProvider,
} from './openai-compat'
import { pollinationsProvider } from './pollinations'
import { qwenProvider } from './qwen'
import { nvidiaProvider } from './nvidia'
import { geminiProvider } from './gemini'
import { togetherProvider } from './together'
import { cloudflareProvider } from './cloudflare'
import { stabilityProvider } from './stability'
import { deepinfraProvider } from './deepinfra'
import { huggingfaceProvider } from './huggingface'
import { falProvider } from './fal'
import { replicateProvider } from './replicate'
import {
  cerebrasProvider,
  deepseekProvider,
  groqProvider,
  mistralProvider,
  openrouterProvider,
} from './cloud-llm'
import { demoProvider } from './demo'

// Default priority order (defaultPriority): local/builtin first, keyless
// cloud next, keyed cloud boosters, text-only LLM clouds last, demo fallback.
const ADAPTERS: ProviderAdapter[] = [
  builtinProvider, // 10 — engine bundled with the runtime, always on
  a1111Provider, // 12 — local SD WebUI / Forge / SD.Next
  comfyProvider, // 14 — local ComfyUI
  ollamaProvider, // 16 — local Ollama
  whispercppProvider, // 18 — local whisper.cpp STT server
  lmstudioProvider, // 20 — local LM Studio
  llamacppProvider, // 22 — local llama.cpp server
  janProvider, // 24 — local Jan
  koboldcppProvider, // 26 — local KoboldCpp
  vllmProvider, // 28 — local vLLM
  localaiProvider, // 30 — local LocalAI
  textgenwebuiProvider, // 32 — local text-generation-webui
  pollinationsProvider, // 40 — keyless cloud (first cloud fallback)
  qwenProvider, // 50 — DashScope (if key present)
  nvidiaProvider, // 55 — NVIDIA NIM (if key present)
  geminiProvider, // 60 — Google AI Studio (if key present)
  togetherProvider, // 65 — Together AI (if key present)
  cloudflareProvider, // 70 — Workers AI (if token present)
  stabilityProvider, // 75 — Stability AI (if key present)
  deepinfraProvider, // 80 — DeepInfra (if key present)
  huggingfaceProvider, // 85 — HF router (if token present)
  falProvider, // 90 — fal.ai (if key present)
  replicateProvider, // 95 — Replicate (if token present)
  groqProvider, // 100 — cloud LLM (chat only)
  mistralProvider, // 105 — cloud LLM (chat only)
  deepseekProvider, // 110 — cloud LLM (chat only)
  cerebrasProvider, // 115 — cloud LLM (chat only)
  openrouterProvider, // 120 — cloud LLM (chat only)
  demoProvider, // 999 — deterministic, clearly labeled
]

const PROBE_TTL_MS = 20000
const probeCache = new Map<string, { value: boolean; ts: number }>()

async function isConfigured(adapter: ProviderAdapter): Promise<boolean> {
  const cached = probeCache.get(adapter.id)
  if (cached && Date.now() - cached.ts < PROBE_TTL_MS) return cached.value
  const value = await adapter
    .isConfigured()
    .catch(() => false)
  probeCache.set(adapter.id, { value, ts: Date.now() })
  return value
}

export function invalidateProbes(): void {
  probeCache.clear()
}

export function getAdapters(): ProviderAdapter[] {
  return ADAPTERS
}

export function getAdapter(id: string): ProviderAdapter | undefined {
  return ADAPTERS.find((a) => a.id === id)
}

async function orderedAdapters(): Promise<ProviderAdapter[]> {
  const config = await readConfig()
  const order = config.providerOrder ?? []
  const byId = new Map(ADAPTERS.map((a) => [a.id, a]))
  const ordered: ProviderAdapter[] = []
  for (const id of order) {
    const a = byId.get(id)
    if (a) {
      ordered.push(a)
      byId.delete(id)
    }
  }
  const rest = [...byId.values()].sort((a, b) => a.defaultPriority - b.defaultPriority)
  return [...ordered, ...rest]
}

export async function getProviderInfos(): Promise<ProviderInfo[]> {
  const ordered = await orderedAdapters()
  const infos = await Promise.all(
    ordered.map(async (adapter, index) => {
      const configured = await isConfigured(adapter)
      let status: ProviderInfo['status'] = 'unavailable'
      let statusDetail: string | undefined
      if (configured) {
        status = 'available'
        if (adapter.kind === 'demo') statusDetail = 'Fallback only — deterministic placeholders.'
      } else {
        status = adapter.kind === 'cloud' ? 'not-configured' : 'unavailable'
        statusDetail = adapter.activationHint
          ? adapter.activationHint
          : adapter.kind === 'cloud'
            ? `Set ${adapter.envVars[0]} in .env.local to activate.`
            : 'Endpoint not reachable right now.'
      }
      let models: ProviderInfo['models'] = []
      try {
        models = adapter.listModels ? await adapter.listModels() : []
      } catch {
        models = []
      }
      return {
        id: adapter.id,
        name: adapter.name,
        kind: adapter.kind,
        description: adapter.description,
        envVars: adapter.envVars,
        docsUrl: adapter.docsUrl,
        configured,
        status,
        statusDetail,
        capabilities: adapter.capabilities(),
        models,
        priority: index + 1,
        note: adapter.note,
      } satisfies ProviderInfo
    })
  )
  return infos
}

export async function setProviderOrder(order: string[]): Promise<ProviderInfo[]> {
  const valid = order.filter((id) => ADAPTERS.some((a) => a.id === id))
  const missing = ADAPTERS.filter((a) => !valid.includes(a.id)).map((a) => a.id)
  await writeConfig({ providerOrder: [...valid, ...missing] })
  invalidateProbes()
  return getProviderInfos()
}

export async function testProvider(id: string): Promise<ProviderTestResult> {
  const adapter = getAdapter(id)
  if (!adapter) {
    return {
      providerId: id,
      ok: false,
      message: `Unknown provider "${id}".`,
      checks: [],
    }
  }
  const t0 = Date.now()
  try {
    const checks = await adapter.testConnection()
    const latencyMs = Date.now() - t0
    const ok = checks.length > 0 && checks.every((c) => c.ok)
    const failed = checks.find((c) => !c.ok)
    return {
      providerId: id,
      ok,
      latencyMs,
      checks,
      message: ok
        ? `${adapter.name}: all checks passed (${latencyMs} ms).`
        : `${adapter.name}: ${failed?.detail ?? 'one or more checks failed.'}`,
    }
  } catch (err) {
    return {
      providerId: id,
      ok: false,
      latencyMs: Date.now() - t0,
      message: err instanceof Error ? err.message : String(err),
      checks: [
        {
          label: 'Diagnostics',
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
        },
      ],
    }
  }
}

function friendlyError(adapter: ProviderAdapter, err: unknown): string {
  if (err instanceof ProviderError) {
    switch (err.code) {
      case 'auth':
        return `${adapter.name}: authentication failed — check the provider key in .env.local.`
      case 'rate-limit':
        return `${adapter.name}: rate limited (429). Falling back — try again shortly.`
      case 'quota':
        return `${adapter.name}: quota/credits exhausted (402). Falling back.`
      case 'timeout':
        return `${adapter.name}: request timed out. Falling back.`
      case 'network':
        return `${adapter.name}: endpoint unreachable. Falling back.`
      case 'unsupported':
        return `${adapter.name}: ${err.message}`
      default:
        return `${adapter.name}: ${err.message}`
    }
  }
  const msg = err instanceof Error ? err.message : String(err)
  if (/401|403|unauthor/i.test(msg)) return `${adapter.name}: authentication failed (${msg.slice(0, 160)}).`
  if (/429|rate.?limit/i.test(msg)) return `${adapter.name}: rate limited. Falling back.`
  return `${adapter.name}: ${msg.slice(0, 220)}`
}

function methodFor(adapter: ProviderAdapter, capability: Capability): (() => Promise<unknown>) | null {
  if (capability === 'textToImage' && adapter.generateImages) return null // handled by callers
  return null
}
void methodFor

export interface FallbackResult<T> {
  result: T
  providerId: string
  events: FallbackEvent[]
}

export type SelectionMode = { mode: 'auto' } | { mode: 'manual'; providerId: string }

async function candidates(capability: Capability, selection: SelectionMode): Promise<ProviderAdapter[]> {
  const ordered = await orderedAdapters()
  if (selection.mode === 'manual') {
    const adapter = ordered.find((a) => a.id === selection.providerId)
    return adapter ? [adapter] : []
  }
  const usable: ProviderAdapter[] = []
  for (const adapter of ordered) {
    if (!adapter.capabilities()[capability]) continue
    const configured = await isConfigured(adapter)
    if (configured) usable.push(adapter)
  }
  return usable
}

async function runWithFallback<T>(
  capability: Capability,
  selection: SelectionMode,
  invoke: (adapter: ProviderAdapter) => Promise<T>
): Promise<FallbackResult<T>> {
  const events: FallbackEvent[] = []
  const list = await candidates(capability, selection)

  if (selection.mode === 'manual') {
    const adapter = list[0]
    if (!adapter) {
      throw new ProviderError('unsupported', `Provider "${selection.providerId}" not found.`)
    }
    if (!adapter.capabilities()[capability]) {
      throw new ProviderError(
        'unsupported',
        `${adapter.name} does not support "${capability}" — switch to AUTO or another provider.`
      )
    }
    try {
      const result = await invoke(adapter)
      events.push({ providerId: adapter.id, ok: true })
      return { result, providerId: adapter.id, events }
    } catch (err) {
      events.push({ providerId: adapter.id, ok: false, error: friendlyError(adapter, err) })
      throw new ProviderError('unknown', `${friendlyError(adapter, err)} (manual mode — no fallback.)`)
    }
  }

  if (list.length === 0) {
    throw new ProviderError(
      'unsupported',
      `No available provider supports "${capability}". Configure one in Settings → Providers or connect a local runtime.`
    )
  }

  let lastMessage = ''
  for (const adapter of list) {
    try {
      const result = await invoke(adapter)
      events.push({ providerId: adapter.id, ok: true })
      return { result, providerId: adapter.id, events }
    } catch (err) {
      const friendly = friendlyError(adapter, err)
      events.push({ providerId: adapter.id, ok: false, error: friendly })
      lastMessage = friendly
    }
  }
  throw new ProviderError('unknown', `All providers failed. Last error: ${lastMessage}`)
}

export async function runGeneration(
  req: ImageGenRequest,
  selection: SelectionMode
): Promise<FallbackResult<GeneratedImage[]>> {
  return runWithFallback('textToImage', selection, (adapter) => {
    if (!adapter.generateImages) {
      throw new ProviderError('unsupported', `${adapter.name} has no image generation.`)
    }
    return adapter.generateImages(req)
  })
}

export async function runEdit(
  req: ImageEditRequest,
  selection: SelectionMode,
  capability: Capability
): Promise<FallbackResult<GeneratedImage[]>> {
  return runWithFallback(capability, selection, (adapter) => {
    if (!adapter.editImage) {
      throw new ProviderError('unsupported', `${adapter.name} has no image editing.`)
    }
    return adapter.editImage(req)
  })
}

export async function runEnhance(
  req: EnhanceRequest,
  selection: SelectionMode
): Promise<FallbackResult<string>> {
  return runWithFallback('promptEnhance', selection, (adapter) => {
    if (!adapter.enhancePrompt) {
      throw new ProviderError('unsupported', `${adapter.name} has no prompt enhancement.`)
    }
    return adapter.enhancePrompt(req)
  })
}

export async function runVideo(
  req: VideoGenRequest,
  selection: SelectionMode,
  capability: 'textToVideo' | 'imageToVideo'
): Promise<FallbackResult<GeneratedVideo[]>> {
  return runWithFallback(capability, selection, (adapter) => {
    if (!adapter.generateVideos) {
      throw new ProviderError('unsupported', `${adapter.name} has no video generation.`)
    }
    return adapter.generateVideos(req)
  })
}

export async function runMusic(
  req: MusicRequest,
  selection: SelectionMode
): Promise<FallbackResult<GeneratedAudio[]>> {
  return runWithFallback('textToMusic', selection, (adapter) => {
    if (!adapter.generateMusic) {
      throw new ProviderError('unsupported', `${adapter.name} has no music generation.`)
    }
    return adapter.generateMusic(req)
  })
}

export async function runSpeech(
  req: SpeechRequest,
  selection: SelectionMode
): Promise<FallbackResult<GeneratedAudio>> {
  return runWithFallback('textToSpeech', selection, (adapter) => {
    if (!adapter.synthesizeSpeech) {
      throw new ProviderError('unsupported', `${adapter.name} has no speech synthesis.`)
    }
    return adapter.synthesizeSpeech(req)
  })
}

export async function runTranscription(
  req: TranscriptionRequest,
  selection: SelectionMode
): Promise<FallbackResult<{ text: string }>> {
  return runWithFallback('speechToText', selection, (adapter) => {
    if (!adapter.transcribeAudio) {
      throw new ProviderError('unsupported', `${adapter.name} has no transcription.`)
    }
    return adapter.transcribeAudio(req)
  })
}

/** Image search is served by whichever adapter supports it (builtin today).
 * No fallback chain — a miss is an actionable error, not a silent fallback. */
export async function runImageSearch(
  query: string,
  num: number
): Promise<{ results: ImageSearchResult[]; providerId: string }> {
  for (const adapter of ADAPTERS) {
    if (!adapter.capabilities().imageSearch || !adapter.searchImages) continue
    const configured = await isConfigured(adapter)
    if (!configured) continue
    const results = await adapter.searchImages({ query, num })
    return { results, providerId: adapter.id }
  }
  throw new ProviderError('unsupported', 'No provider supports image search.')
}

/** Which provider would AUTO pick right now for a capability (for UI hints). */
export async function resolveAutoProvider(capability: Capability): Promise<ProviderAdapter | null> {
  const list = await candidates(capability, { mode: 'auto' })
  return list[0] ?? null
}

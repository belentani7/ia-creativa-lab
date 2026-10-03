'use client'

import type {
  AssetRef,
  FallbackEvent,
  GenerationRecord,
  ProviderInfo,
  ProviderTestResult,
} from './types'
import type { EditMode } from './prompt'
import type { ImageSearchResult } from './providers/types'

async function json<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as T & { error?: string }
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return body as T
}

export async function fetchProviders(): Promise<ProviderInfo[]> {
  const res = await fetch('/api/firelab/providers', { cache: 'no-store' })
  const data = await json<{ providers: ProviderInfo[] }>(res)
  return data.providers
}

export async function testProviderConnection(id: string): Promise<ProviderTestResult> {
  const res = await fetch('/api/firelab/providers/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  const data = await json<{ result: ProviderTestResult }>(res)
  return data.result
}

export async function setProviderPriority(order: string[]): Promise<ProviderInfo[]> {
  const res = await fetch('/api/firelab/providers/priority', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  })
  const data = await json<{ providers: ProviderInfo[] }>(res)
  return data.providers
}

export interface GenerateResponse {
  generation: GenerationRecord
  assets: AssetRef[]
  providerId: string
  demo: boolean
  events: { providerId: string; ok: boolean; error?: string }[]
  durationMs: number
}

export async function generateImage(
  body: {
    providerId: string
    prompt: string
    negativePrompt?: string
    size: string
    count: number
    style?: string
    seed?: number | null
    projectId?: string | null
    allowDemo?: boolean
  },
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const res = await fetch('/api/firelab/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  return json<GenerateResponse>(res)
}

export async function editImage(
  body: {
    providerId: string
    mode: EditMode
    image: string
    instruction?: string
    hasMask?: boolean
    width?: number
    height?: number
    count?: number
    projectId?: string | null
    allowDemo?: boolean
  },
  signal?: AbortSignal
): Promise<GenerateResponse> {
  const res = await fetch('/api/firelab/edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  return json<GenerateResponse>(res)
}

export async function enhancePrompt(
  body: { prompt: string; mode: 'cinematic' | 'editorial'; providerId?: string },
  signal?: AbortSignal
): Promise<{ enhanced: string; providerId: string; durationMs: number }> {
  const res = await fetch('/api/firelab/enhance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  return json(res)
}

// ————— video / music / speech / transcription / image search —————

export interface VideoParams {
  prompt: string
  /** Data URL start frame — present ⇒ image-to-video. */
  image?: string
  size?: string
  durationSec?: number
  count?: number
  seed?: number | null
  mode?: 'auto' | 'manual'
  providerId?: string
  projectId?: string | null
  allowDemo?: boolean
}

/**
 * POST /api/firelab/video — 15–180 s for the built-in engine (cogvideox-3),
 * ~1 s for the DEMO GIF fallback. No client timeout (like generate).
 */
export async function postVideo(params: VideoParams, signal?: AbortSignal): Promise<GenerateResponse> {
  const res = await fetch('/api/firelab/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  })
  return json<GenerateResponse>(res)
}

export interface MusicParams {
  prompt: string
  durationSec?: number
  count?: number
  seed?: number | null
  mode?: 'auto' | 'manual'
  providerId?: string
  projectId?: string | null
}

/** POST /api/firelab/music — built-in procedural synth is instant. */
export async function postMusic(params: MusicParams, signal?: AbortSignal): Promise<GenerateResponse> {
  const res = await fetch('/api/firelab/music', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  })
  return json<GenerateResponse>(res)
}

export interface SpeechParams {
  text: string
  voice?: string
  speed?: number
  mode?: 'auto' | 'manual'
  providerId?: string
  projectId?: string | null
}

/** POST /api/firelab/speech — one audio/wav asset, ~3 s. */
export async function postSpeech(params: SpeechParams, signal?: AbortSignal): Promise<GenerateResponse> {
  const res = await fetch('/api/firelab/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  })
  return json<GenerateResponse>(res)
}

export interface TranscribeParams {
  /** Audio data URL (data:audio/…;base64,…). */
  audio: string
  language?: string
  mode?: 'auto' | 'manual'
  providerId?: string
  projectId?: string | null
}

export interface TranscribeResponse {
  generation: GenerationRecord
  text: string
  providerId: string
  events: FallbackEvent[]
  durationMs: number
}

/** POST /api/firelab/transcribe — speech → text, ~1 s. */
export async function postTranscribe(
  params: TranscribeParams,
  signal?: AbortSignal
): Promise<TranscribeResponse> {
  const res = await fetch('/api/firelab/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal,
  })
  return json<TranscribeResponse>(res)
}

export interface ImageSearchResponse {
  results: ImageSearchResult[]
  providerId: string
  query: string
  durationMs: number
}

/** POST /api/firelab/image-search (action 'search') — reference lookup. */
export async function imageSearch(
  query: string,
  num = 12,
  signal?: AbortSignal
): Promise<ImageSearchResponse> {
  const res = await fetch('/api/firelab/image-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'search', query, num }),
    signal,
  })
  return json<ImageSearchResponse>(res)
}

export interface DownloadSearchResponse {
  asset: AssetRef
  generation: GenerationRecord
  durationMs: number
}

/** POST /api/firelab/image-search (action 'download') — server-side fetch → asset. */
export async function downloadSearchImage(url: string, signal?: AbortSignal): Promise<DownloadSearchResponse> {
  const res = await fetch('/api/firelab/image-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'download', url }),
    signal,
  })
  return json<DownloadSearchResponse>(res)
}

export interface ProjectDTO {
  id: string
  name: string
  canvas: {
    imageAssetId?: string
    maskAssetId?: string
    width?: number
    height?: number
    prompt?: string
    tool?: string
    savedAt?: string
  }
  createdAt: string
  updatedAt: string
}

export async function fetchProjects(): Promise<ProjectDTO[]> {
  const res = await fetch('/api/firelab/projects', { cache: 'no-store' })
  const data = await json<{ projects: ProjectDTO[] }>(res)
  return data.projects
}

export async function createProject(name: string): Promise<ProjectDTO> {
  const res = await fetch('/api/firelab/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const data = await json<{ project: ProjectDTO }>(res)
  return data.project
}

export async function updateProject(
  id: string,
  body: { name?: string; canvas?: ProjectDTO['canvas'] }
): Promise<ProjectDTO> {
  const res = await fetch(`/api/firelab/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await json<{ project: ProjectDTO }>(res)
  return data.project
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/firelab/projects/${id}`, { method: 'DELETE' })
  await json<{ ok: boolean }>(res)
}

export async function fetchHistory(opts?: {
  limit?: number
  kind?: string
}): Promise<GenerationRecord[]> {
  const params = new URLSearchParams()
  if (opts?.limit) params.set('limit', String(opts.limit))
  if (opts?.kind) params.set('kind', opts.kind)
  const res = await fetch(`/api/firelab/history?${params.toString()}`, { cache: 'no-store' })
  const data = await json<{ generations: GenerationRecord[] }>(res)
  return data.generations
}

export async function uploadAsset(dataUrl: string): Promise<AssetRef> {
  const res = await fetch('/api/firelab/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dataUrl }),
  })
  const data = await json<{ asset: AssetRef }>(res)
  return data.asset
}

/** Fetch a stored asset and return it as a data URL (for canvas use). */
export async function assetToDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch asset (${res.status})`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read asset'))
    reader.readAsDataURL(blob)
  })
}

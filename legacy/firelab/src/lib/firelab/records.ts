// BELENTANI FIRELAB — generation record helpers (server)
import { db } from '@/lib/db'
import type { AssetRef, GenerationKind, GenerationRecord } from './types'
import type { SavedAsset } from './storage'

export function toAssetRefs(assets: SavedAsset[]): AssetRef[] {
  return assets.map((a) => ({
    id: a.id,
    url: a.url,
    thumbUrl: a.thumbUrl,
    width: a.width,
    height: a.height,
    mime: a.mime,
  }))
}

export async function recordGeneration(input: {
  kind: GenerationKind
  prompt?: string | null
  provider: string
  params?: Record<string, unknown>
  projectId?: string | null
  assets?: SavedAsset[]
  status?: string
  error?: string
  durationMs?: number
}): Promise<GenerationRecord> {
  const params: Record<string, unknown> = {
    ...(input.params ?? {}),
    ...(input.assets && input.assets.length > 0
      ? { assets: toAssetRefs(input.assets) }
      : {}),
  }
  const row = await db.generation.create({
    data: {
      kind: input.kind,
      prompt: input.prompt ?? null,
      provider: input.provider,
      params: JSON.stringify(params),
      projectId: input.projectId ?? null,
      status: input.status ?? (input.error ? 'failed' : 'completed'),
      error: input.error ?? null,
      durationMs: input.durationMs ?? null,
    },
  })
  return {
    id: row.id,
    kind: row.kind as GenerationKind,
    prompt: row.prompt,
    provider: row.provider,
    status: row.status,
    error: row.error,
    durationMs: row.durationMs,
    createdAt: row.createdAt.toISOString(),
    params,
    assets: (params.assets as AssetRef[]) ?? [],
  }
}

export function parseGenerationRow(row: {
  id: string
  kind: string
  prompt: string | null
  provider: string
  params: string
  status: string
  error: string | null
  durationMs: number | null
  createdAt: Date
}): GenerationRecord {
  let params: Record<string, unknown> = {}
  try {
    params = JSON.parse(row.params)
  } catch {
    params = {}
  }
  return {
    id: row.id,
    kind: row.kind as GenerationKind,
    prompt: row.prompt,
    provider: row.provider,
    status: row.status,
    error: row.error,
    durationMs: row.durationMs,
    createdAt: row.createdAt.toISOString(),
    params,
    assets: (params.assets as AssetRef[]) ?? [],
  }
}

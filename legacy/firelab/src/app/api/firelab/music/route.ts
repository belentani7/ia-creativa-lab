// POST /api/firelab/music — text-to-music via the provider manager
// AUTO chain: built-in procedural synth (honest, rule-based — not a neural
// model) → Replicate musicgen (if keyed). Durations clamp to 5–120 s.
import { NextRequest, NextResponse } from 'next/server'
import { runMusic, type SelectionMode } from '@/lib/firelab/providers/manager'
import { saveAsset, type SavedAsset } from '@/lib/firelab/storage'
import { recordGeneration } from '@/lib/firelab/records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface MusicBody {
  providerId?: string
  mode?: 'auto' | 'manual'
  prompt?: string
  durationSec?: number
  count?: number
  seed?: number
  projectId?: string | null
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: MusicBody
  try {
    body = (await req.json()) as MusicBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = (body.prompt ?? '').trim()
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })
  }

  const durationSec = Math.min(Math.max(body.durationSec ?? 20, 5), 120)
  const count = Math.min(Math.max(body.count ?? 1, 1), 4)

  const manual = body.mode === 'manual' || (body.providerId && body.providerId !== 'auto')
  if (manual && !body.providerId) {
    return NextResponse.json({ error: 'Manual mode needs a providerId.' }, { status: 400 })
  }
  const selection: SelectionMode = manual
    ? { mode: 'manual', providerId: (body.providerId as string).replace(/^auto$/, 'builtin') }
    : { mode: 'auto' }

  try {
    const { result, providerId, events } = await runMusic(
      { prompt, durationSec, count, seed: body.seed },
      selection
    )

    const assets: SavedAsset[] = []
    const synthMeta: (Record<string, unknown> | null)[] = []
    for (const audio of result) {
      assets.push(await saveAsset({ base64: audio.base64, mime: audio.mime }, 'music'))
      synthMeta.push(audio.meta ?? null)
    }
    const generation = await recordGeneration({
      kind: 'music',
      prompt,
      provider: providerId,
      projectId: body.projectId ?? null,
      assets,
      durationMs: Date.now() - started,
      params: {
        durationSec,
        count,
        seed: body.seed,
        mimes: result.map((a) => a.mime),
        synth: synthMeta,
      },
    })

    return NextResponse.json({
      generation,
      assets,
      providerId,
      events,
      durationMs: Date.now() - started,
      synth: synthMeta,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Music generation failed'
    await recordGeneration({
      kind: 'music',
      prompt,
      provider: body.providerId ?? 'auto',
      projectId: body.projectId ?? null,
      status: 'failed',
      error: message,
      durationMs: Date.now() - started,
      params: { durationSec, count },
    }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

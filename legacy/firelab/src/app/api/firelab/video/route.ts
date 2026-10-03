// POST /api/firelab/video — text-to-video / image-to-video via the provider manager
// AUTO chain: built-in video engine (cogvideox-3, submit+poll) → fal / Replicate
// (if keyed) → HF router (experimental) → DEMO animated GIF. Long jobs: 10 min budget.
import { NextRequest, NextResponse } from 'next/server'
import { runVideo, type SelectionMode } from '@/lib/firelab/providers/manager'
import { saveAsset, type SavedAsset } from '@/lib/firelab/storage'
import { recordGeneration } from '@/lib/firelab/records'
import { parseSize } from '@/lib/firelab/providers/types'
import type { GenerationKind } from '@/lib/firelab/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 600

interface VideoBody {
  providerId?: string
  mode?: 'auto' | 'manual'
  prompt?: string
  image?: string // data URL start frame (image-to-video)
  size?: string
  durationSec?: number
  count?: number
  seed?: number
  projectId?: string | null
  allowDemo?: boolean
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: VideoBody
  try {
    body = (await req.json()) as VideoBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = (body.prompt ?? '').trim()
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })
  }
  if (body.image && !body.image.startsWith('data:image/')) {
    return NextResponse.json(
      { error: 'The start frame must be an image data URL for image-to-video.' },
      { status: 400 }
    )
  }
  if (body.image && body.image.length > 14_000_000) {
    return NextResponse.json(
      { error: 'Start frame too large (>10 MB). Reduce the resolution and retry.' },
      { status: 413 }
    )
  }

  const size = /\d+x\d+/.test(body.size ?? '') ? (body.size as string) : '1024x576'
  const count = Math.min(Math.max(body.count ?? 1, 1), 4)
  const durationSec = Math.min(Math.max(body.durationSec ?? 5, 1), 60)
  const capability: 'textToVideo' | 'imageToVideo' = body.image ? 'imageToVideo' : 'textToVideo'

  const manual = body.mode === 'manual' || (body.providerId && body.providerId !== 'auto')
  if (manual && !body.providerId) {
    return NextResponse.json({ error: 'Manual mode needs a providerId.' }, { status: 400 })
  }
  const selection: SelectionMode = manual
    ? { mode: 'manual', providerId: (body.providerId as string).replace(/^auto$/, 'builtin') }
    : { mode: 'auto' }

  const kind: GenerationKind = body.image ? 'image-to-video' : 'text-to-video'

  try {
    const { result, providerId, events } = await runVideo(
      {
        prompt,
        ...(body.image ? { image: body.image } : {}),
        size,
        durationSec,
        count,
        seed: body.seed,
      },
      selection,
      capability
    )

    const isDemo = providerId === 'demo'
    if (isDemo && body.allowDemo === false) {
      return NextResponse.json(
        {
          error: 'All real video providers failed and Demo Mode is disabled.',
          events,
        },
        { status: 503 }
      )
    }

    const assets: SavedAsset[] = []
    for (const video of result) {
      assets.push(
        await saveAsset({ base64: video.base64, mime: video.mime }, body.image ? 'i2v' : 't2v')
      )
    }
    const { width, height } = parseSize(size)
    const generation = await recordGeneration({
      kind,
      prompt,
      provider: providerId,
      projectId: body.projectId ?? null,
      assets,
      durationMs: Date.now() - started,
      params: {
        size,
        requestedWidth: width,
        requestedHeight: height,
        durationSec,
        count,
        seed: body.seed,
        mode: capability,
        resultMimes: result.map((v) => v.mime),
        resultDurations: result.map((v) => v.durationSec ?? null),
      },
    })

    return NextResponse.json({
      generation,
      assets,
      providerId,
      demo: isDemo,
      events,
      durationMs: Date.now() - started,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Video generation failed'
    await recordGeneration({
      kind,
      prompt,
      provider: body.providerId ?? 'auto',
      projectId: body.projectId ?? null,
      status: 'failed',
      error: message,
      durationMs: Date.now() - started,
      params: { size, durationSec, count, mode: capability },
    }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

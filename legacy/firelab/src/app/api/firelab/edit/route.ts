// POST /api/firelab/edit — image editing (fill / remove / expand / background / variations / refine)
import { NextRequest, NextResponse } from 'next/server'
import { buildEditInstruction, type EditMode } from '@/lib/firelab/prompt'
import { runEdit, type SelectionMode } from '@/lib/firelab/providers/manager'
import { saveImages } from '@/lib/firelab/storage'
import { recordGeneration } from '@/lib/firelab/records'
import { nearestSupportedSize, type GenerationKind } from '@/lib/firelab/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MODE_TO_CAPABILITY: Record<EditMode, string> = {
  fill: 'inpainting',
  remove: 'removeObject',
  expand: 'outpainting',
  background: 'removeBackground',
  variations: 'variations',
  refine: 'imageToImage',
}

interface EditBody {
  providerId?: string
  mode?: EditMode
  image?: string // data URL of the (mask-composited) image
  instruction?: string // user's prompt for the edit
  hasMask?: boolean
  width?: number
  height?: number
  count?: number
  projectId?: string | null
  allowDemo?: boolean
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: EditBody
  try {
    body = (await req.json()) as EditBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const mode = body.mode ?? 'fill'
  if (!MODE_TO_CAPABILITY[mode]) {
    return NextResponse.json({ error: `Unknown edit mode "${mode}".` }, { status: 400 })
  }
  if (!body.image || !body.image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'An image is required (data URL).' }, { status: 400 })
  }
  if (body.image.length > 14_000_000) {
    return NextResponse.json(
      { error: 'Image payload too large (>10 MB). Reduce the resolution and retry.' },
      { status: 413 }
    )
  }

  const count = Math.min(Math.max(body.count ?? 1, 1), 4)
  const size = nearestSupportedSize(body.width ?? 1024, body.height ?? 1024)
  const instruction = buildEditInstruction(mode, body.instruction ?? '', body.hasMask ?? true)

  const selection: SelectionMode =
    body.providerId && body.providerId !== 'auto'
      ? { mode: 'manual', providerId: body.providerId }
      : { mode: 'auto' }

  try {
    const { result, providerId, events } = await runEdit(
      {
        image: body.image,
        prompt: instruction,
        size,
        count,
      },
      selection,
      MODE_TO_CAPABILITY[mode] as Parameters<typeof runEdit>[2]
    )

    const isDemo = providerId === 'demo'
    if (isDemo && body.allowDemo === false) {
      return NextResponse.json(
        {
          error: 'All real providers failed and Demo Mode is disabled.',
          events,
        },
        { status: 503 }
      )
    }

    const assets = await saveImages(result, mode)
    const generation = await recordGeneration({
      kind: mode as GenerationKind,
      prompt: body.instruction?.trim() || null,
      provider: providerId,
      projectId: body.projectId ?? null,
      assets,
      durationMs: Date.now() - started,
      params: { mode, size, count, hasMask: body.hasMask ?? true },
    })

    return NextResponse.json({
      generation,
      assets,
      providerId,
      demo: isDemo,
      events,
      instruction,
      durationMs: Date.now() - started,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Edit failed'
    await recordGeneration({
      kind: mode as GenerationKind,
      prompt: body.instruction?.trim() || null,
      provider: body.providerId ?? 'auto',
      projectId: body.projectId ?? null,
      status: 'failed',
      error: message,
      durationMs: Date.now() - started,
      params: { mode, size, count },
    }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

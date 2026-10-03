// POST /api/firelab/generate — text-to-image via the provider manager
import { NextRequest, NextResponse } from 'next/server'
import { styleSuffix } from '@/lib/firelab/prompt'
import { runGeneration, type SelectionMode } from '@/lib/firelab/providers/manager'
import { saveImages } from '@/lib/firelab/storage'
import { recordGeneration } from '@/lib/firelab/records'
import { BUILTIN_SUPPORTED_SIZES } from '@/lib/firelab/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface GenerateBody {
  providerId?: string // 'auto' | provider id
  prompt?: string
  negativePrompt?: string
  size?: string
  count?: number
  style?: string
  seed?: number
  projectId?: string | null
  allowDemo?: boolean
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: GenerateBody
  try {
    body = (await req.json()) as GenerateBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = (body.prompt ?? '').trim()
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })
  }

  const size = (BUILTIN_SUPPORTED_SIZES as readonly string[]).includes(body.size ?? '')
    ? (body.size as string)
    : '1024x1024'
  const count = Math.min(Math.max(body.count ?? 1, 1), 4)
  const fullPrompt = [prompt, styleSuffix(body.style)].filter(Boolean).join(', ')

  const selection: SelectionMode =
    body.providerId && body.providerId !== 'auto'
      ? { mode: 'manual', providerId: body.providerId }
      : { mode: 'auto' }

  try {
    const { result, providerId, events } = await runGeneration(
      {
        prompt: fullPrompt,
        negativePrompt: body.negativePrompt?.trim() || undefined,
        size,
        count,
        seed: body.seed,
      },
      selection
    )

    const isDemo = providerId === 'demo'
    if (isDemo && body.allowDemo === false) {
      return NextResponse.json(
        {
          error:
            'All real providers failed and Demo Mode is disabled. Try again or review Providers settings.',
          events,
        },
        { status: 503 }
      )
    }

    const assets = await saveImages(result, 'gen')
    const generation = await recordGeneration({
      kind: 'text-to-image',
      prompt: fullPrompt,
      provider: providerId,
      projectId: body.projectId ?? null,
      assets,
      durationMs: Date.now() - started,
      params: { size, count, style: body.style ?? 'none', seed: body.seed },
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
    const message = err instanceof Error ? err.message : 'Generation failed'
    await recordGeneration({
      kind: 'text-to-image',
      prompt: fullPrompt,
      provider: body.providerId ?? 'auto',
      projectId: body.projectId ?? null,
      status: 'failed',
      error: message,
      durationMs: Date.now() - started,
      params: { size, count, style: body.style ?? 'none' },
    }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

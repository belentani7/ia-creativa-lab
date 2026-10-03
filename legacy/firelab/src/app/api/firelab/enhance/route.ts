// POST /api/firelab/enhance — prompt enhancement via LLM providers
import { NextRequest, NextResponse } from 'next/server'
import { runEnhance, type SelectionMode } from '@/lib/firelab/providers/manager'
import { recordGeneration } from '@/lib/firelab/records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface EnhanceBody {
  prompt?: string
  mode?: 'cinematic' | 'editorial' | 'general'
  providerId?: string
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: EnhanceBody
  try {
    body = (await req.json()) as EnhanceBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const prompt = (body.prompt ?? '').trim()
  if (!prompt) {
    return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 })
  }

  const selection: SelectionMode =
    body.providerId && body.providerId !== 'auto'
      ? { mode: 'manual', providerId: body.providerId }
      : { mode: 'auto' }

  try {
    const { result, providerId, events } = await runEnhance(
      { prompt, mode: body.mode ?? 'cinematic' },
      selection
    )
    await recordGeneration({
      kind: 'enhance',
      prompt,
      provider: providerId,
      durationMs: Date.now() - started,
      params: { enhanced: result.slice(0, 400), mode: body.mode ?? 'cinematic' },
    })
    return NextResponse.json({ enhanced: result, providerId, events, durationMs: Date.now() - started })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Enhancement failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

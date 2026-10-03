// POST /api/firelab/speech — text-to-speech via the provider manager
// Built-in engine (7 voices, WAV). Text is clamped to 5000 chars; the engine
// chunks anything over 1024 and concatenates the WAVs properly.
import { NextRequest, NextResponse } from 'next/server'
import { runSpeech, type SelectionMode } from '@/lib/firelab/providers/manager'
import { BUILTIN_TTS_VOICES } from '@/lib/firelab/providers/builtin'
import { saveAsset } from '@/lib/firelab/storage'
import { recordGeneration } from '@/lib/firelab/records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface SpeechBody {
  providerId?: string
  mode?: 'auto' | 'manual'
  text?: string
  voice?: string
  speed?: number
  projectId?: string | null
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: SpeechBody
  try {
    body = (await req.json()) as SpeechBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const text = (body.text ?? '').trim().slice(0, 5000)
  if (!text) {
    return NextResponse.json({ error: 'Text is required.' }, { status: 400 })
  }

  const voice = body.voice ?? BUILTIN_TTS_VOICES[0]
  if (!(BUILTIN_TTS_VOICES as readonly string[]).includes(voice)) {
    return NextResponse.json(
      {
        error: `Unknown voice "${voice}". Supported: ${BUILTIN_TTS_VOICES.join(', ')}.`,
      },
      { status: 400 }
    )
  }

  const speed = Math.min(Math.max(body.speed ?? 1.0, 0.5), 2.0)

  const manual = body.mode === 'manual' || (body.providerId && body.providerId !== 'auto')
  if (manual && !body.providerId) {
    return NextResponse.json({ error: 'Manual mode needs a providerId.' }, { status: 400 })
  }
  const selection: SelectionMode = manual
    ? { mode: 'manual', providerId: (body.providerId as string).replace(/^auto$/, 'builtin') }
    : { mode: 'auto' }

  try {
    const { result, providerId, events } = await runSpeech({ text, voice, speed }, selection)

    const assets = [await saveAsset({ base64: result.base64, mime: result.mime }, 'speech')]
    const generation = await recordGeneration({
      kind: 'speech',
      prompt: text.slice(0, 500),
      provider: providerId,
      projectId: body.projectId ?? null,
      assets,
      durationMs: Date.now() - started,
      params: {
        voice,
        speed,
        chars: text.length,
        mime: result.mime,
        durationSec: result.durationSec ?? null,
        text,
      },
    })

    return NextResponse.json({
      generation,
      assets,
      providerId,
      events,
      durationMs: Date.now() - started,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Speech synthesis failed'
    await recordGeneration({
      kind: 'speech',
      prompt: text.slice(0, 500),
      provider: body.providerId ?? 'auto',
      projectId: body.projectId ?? null,
      status: 'failed',
      error: message,
      durationMs: Date.now() - started,
      params: { voice, speed, chars: text.length },
    }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

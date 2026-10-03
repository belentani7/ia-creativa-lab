// POST /api/firelab/transcribe — speech-to-text via the provider manager
// AUTO chain: local whisper.cpp server → built-in ASR engine. Records a
// 'transcription' generation with the transcript in params (no assets).
import { NextRequest, NextResponse } from 'next/server'
import { runTranscription, type SelectionMode } from '@/lib/firelab/providers/manager'
import { recordGeneration } from '@/lib/firelab/records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

interface TranscribeBody {
  providerId?: string
  mode?: 'auto' | 'manual'
  audio?: string // data URL (audio/wav, audio/mpeg…)
  language?: string
  projectId?: string | null
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: TranscribeBody
  try {
    body = (await req.json()) as TranscribeBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const audio = (body.audio ?? '').trim()
  if (!audio.startsWith('data:audio/')) {
    return NextResponse.json(
      { error: 'An audio data URL is required (data:audio/wav;base64,…).' },
      { status: 400 }
    )
  }
  if (audio.length > 26_000_000) {
    return NextResponse.json(
      { error: 'Audio payload too large (~>18 MB). Trim or compress the recording.' },
      { status: 413 }
    )
  }

  const language = body.language?.trim() || undefined

  const manual = body.mode === 'manual' || (body.providerId && body.providerId !== 'auto')
  if (manual && !body.providerId) {
    return NextResponse.json({ error: 'Manual mode needs a providerId.' }, { status: 400 })
  }
  const selection: SelectionMode = manual
    ? { mode: 'manual', providerId: (body.providerId as string).replace(/^auto$/, 'builtin') }
    : { mode: 'auto' }

  try {
    const { result, providerId, events } = await runTranscription(
      { audio, ...(language ? { language } : {}) },
      selection
    )

    const generation = await recordGeneration({
      kind: 'transcription',
      prompt: null,
      provider: providerId,
      projectId: body.projectId ?? null,
      durationMs: Date.now() - started,
      params: {
        transcript: result.text,
        language: language ?? null,
        audioChars: audio.length,
      },
    })

    return NextResponse.json({
      generation,
      text: result.text,
      providerId,
      events,
      durationMs: Date.now() - started,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transcription failed'
    await recordGeneration({
      kind: 'transcription',
      prompt: null,
      provider: body.providerId ?? 'auto',
      projectId: body.projectId ?? null,
      status: 'failed',
      error: message,
      durationMs: Date.now() - started,
      params: { language: language ?? null, audioChars: audio.length },
    }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

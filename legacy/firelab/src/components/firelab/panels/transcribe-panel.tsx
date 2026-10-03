'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ClipboardCopy, FileAudio, Loader2, Mic, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useFireLab } from '@/lib/firelab/store'
import { useRunJob } from '@/lib/firelab/jobs'
import { postTranscribe } from '@/lib/firelab/api-client'
import { ProviderSelect } from '../provider-select'

const MAX_BYTES = 18 * 1024 * 1024 // server cap ~18 MB of audio

interface LoadedAudio {
  name: string
  size: number
  dataUrl: string
}

export function TranscribePanel() {
  const transcribeLanguage = useFireLab((s) => s.transcribeLanguage)
  const providerMode = useFireLab((s) => s.providerMode)
  const set = useFireLab((s) => s.set)
  const setTool = useFireLab((s) => s.setTool)
  const setView = useFireLab((s) => s.setView)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [audio, setAudio] = useState<LoadedAudio | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !/\.(wav|mp3|m4a|ogg|flac|aac|webm)$/i.test(file.name)) {
      toast.error('Not an audio file', { description: `“${file.name}” — pick a WAV, MP3, M4A, OGG or FLAC file.` })
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('File too large', { description: 'Audio must stay under ~18 MB — trim or compress the recording.' })
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setAudio({ name: file.name, size: file.size, dataUrl: reader.result as string })
      setTranscript(null)
    }
    reader.onerror = () => toast.error('Could not read the file', { description: 'The browser failed to read the audio file.' })
    reader.readAsDataURL(file)
  }

  const onTranscribe = async () => {
    if (running || !audio) return
    setRunning(true)
    try {
      await runJob({
        id: crypto.randomUUID(),
        kind: 'transcription',
        label: `Transcribe · ${audio.name}`,
        fn: async (signal) => {
          const res = await postTranscribe(
            {
              audio: audio.dataUrl,
              ...(transcribeLanguage.trim() ? { language: transcribeLanguage.trim() } : {}),
              mode: providerMode === 'auto' ? 'auto' : 'manual',
              ...(providerMode !== 'auto' ? { providerId: providerMode } : {}),
            },
            signal
          )
          return {
            results: [],
            providerId: res.providerId,
            demo: false,
            events: res.events,
            durationMs: res.durationMs,
            extra: { text: res.text },
          }
        },
        onDone: (res) => {
          const text = typeof res.extra?.text === 'string' ? (res.extra.text as string) : ''
          setTranscript(text)
          toast.success('Transcription ready', {
            description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s · ${text.length.toLocaleString()} chars.`,
          })
        },
      })
    } catch (err) {
      toast.error('Transcription failed', {
        description: err instanceof Error ? err.message : 'All transcription providers failed — see History for details.',
      })
    } finally {
      setRunning(false)
    }
  }

  const onCopy = async () => {
    if (!transcript) return
    try {
      await navigator.clipboard.writeText(transcript)
      toast.success('Transcript copied')
    } catch {
      toast.error('Copy failed', { description: 'Your browser blocked clipboard access — select the text manually.' })
    }
  }

  const onUseAsPrompt = () => {
    if (!transcript?.trim()) return
    set('prompt', transcript.trim())
    setTool('generate')
    setView('studio')
    toast.success('Sent to Generate', {
      description: 'The transcript is now the image prompt — switch tools to tweak it.',
    })
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2" aria-label="Audio file">
        <span className="micro-label">Audio</span>
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop an audio file or click to browse"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              fileRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) loadFile(file)
          }}
          className={`focus-ember flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-4 text-center transition ${
            dragging
              ? 'border-ember/70 bg-accent'
              : 'border-border bg-secondary/20 hover:border-ember/50 hover:bg-secondary/40'
          }`}
        >
          <Upload className="h-5 w-5 text-ember" aria-hidden="true" />
          <p className="text-xs text-foreground/80">
            {audio ? 'Drop another file or click to replace' : 'Drop an audio file, or click to browse'}
          </p>
          <p className="text-[10px] text-muted-foreground">WAV · MP3 · M4A · OGG · FLAC — up to ~18 MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) loadFile(file)
            e.target.value = ''
          }}
        />
      </section>

      {audio && (
        <section className="space-y-2 rounded-md border bg-secondary/30 p-3" aria-label="Selected audio">
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4 shrink-0 text-ember" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate text-xs text-foreground/90" title={audio.name}>
              {audio.name}
            </p>
            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
              {(audio.size / (1024 * 1024)).toFixed(1)} MB
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                setAudio(null)
                setTranscript(null)
              }}
              aria-label="Remove audio file"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <audio controls src={audio.dataUrl} className="h-9 w-full" preload="metadata" />
        </section>
      )}

      <section className="space-y-1.5" aria-label="Language">
        <Label htmlFor="fl-lang" className="micro-label">Language (optional)</Label>
        <Input
          id="fl-lang"
          value={transcribeLanguage}
          onChange={(e) => set('transcribeLanguage', e.target.value)}
          placeholder="auto — e.g. en, zh, fr"
          className="h-8 border-border bg-secondary/30 text-xs"
        />
      </section>

      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect capability="speechToText" value={providerMode} onChange={(v) => set('providerMode', v)} />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            AUTO tries a local whisper.cpp server first, then falls back to the built-in ASR engine.
          </p>
        </CollapsibleContent>
      </Collapsible>

      {transcript !== null && (
        <section className="space-y-2" aria-label="Transcript">
          <div className="flex items-center justify-between">
            <span className="micro-label">Transcript</span>
            <span className="text-[11px] text-muted-foreground">{transcript.length.toLocaleString()} chars</span>
          </div>
          <div
            className="scroll-thin max-h-48 overflow-y-auto select-text whitespace-pre-wrap rounded-md border bg-secondary/30 p-3 text-xs leading-relaxed text-foreground/90"
            aria-live="polite"
          >
            {transcript || '(the engine returned empty text)'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => void onCopy()} disabled={!transcript}>
              <ClipboardCopy className="h-3.5 w-3.5" /> Copy
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={onUseAsPrompt} disabled={!transcript.trim()}>
              <Mic className="h-3.5 w-3.5 text-ember" /> Use as prompt
            </Button>
          </div>
        </section>
      )}

      <Button
        onClick={() => void onTranscribe()}
        disabled={running || !audio}
        className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Transcribing…
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" /> Transcribe
          </>
        )}
      </Button>
    </div>
  )
}

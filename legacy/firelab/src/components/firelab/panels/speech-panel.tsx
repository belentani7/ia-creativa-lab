'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AudioLines, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFireLab } from '@/lib/firelab/store'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { postSpeech } from '@/lib/firelab/api-client'
import { ProviderSelect, resolveAutoProvider } from '../provider-select'
import type { Capability } from '@/lib/firelab/types'

const VOICES = [
  { id: 'tongtong', label: 'Tongtong · warm' },
  { id: 'chuichui', label: 'Chuichui · lively' },
  { id: 'xiaochen', label: 'Xiaochen · calm' },
  { id: 'jam', label: 'Jam · british' },
  { id: 'kazi', label: 'Kazi · clear' },
  { id: 'douji', label: 'Douji · natural' },
  { id: 'luodo', label: 'Luodo · expressive' },
] as const

const MAX_CHARS = 5000

export function SpeechPanel() {
  const speechText = useFireLab((s) => s.speechText)
  const speechVoice = useFireLab((s) => s.speechVoice)
  const speechSpeed = useFireLab((s) => s.speechSpeed)
  const providers = useFireLab((s) => s.providers)
  const providerMode = useFireLab((s) => s.providerMode)
  const projectId = useFireLab((s) => s.projectId)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null)

  const capability: Capability = 'textToSpeech'
  const activeProvider =
    providerMode === 'auto'
      ? resolveAutoProvider(providers, capability)
      : providers.find((p) => p.id === providerMode) ?? null
  const capableCount = providers.filter((p) => p.capabilities[capability]).length

  const onSpeak = async () => {
    if (running || !speechText.trim()) return
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'speech',
        label: `Speech · ${speechVoice}`,
        prompt: speechText.trim() || undefined,
        fn: async (signal) =>
          toJobResult(
            await postSpeech(
              {
                text: speechText,
                voice: speechVoice,
                speed: speechSpeed,
                mode: providerMode === 'auto' ? 'auto' : 'manual',
                ...(providerMode !== 'auto' ? { providerId: providerMode } : {}),
                projectId,
              },
              signal
            )
          ),
        onDone: (res) => {
          const asset = res.results[0]
          if (asset) setLastAudioUrl(asset.url)
          toast.success('Speech synthesized', {
            description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s · ${speechText.length.toLocaleString()} chars → 1 WAV. Also playable in the history strip.`,
          })
        },
      })
    } catch (err) {
      toast.error('Speech synthesis failed', {
        description: err instanceof Error ? err.message : 'All speech providers failed — see History for details.',
      })
    } finally {
      setRunning(false)
      setJobId(null)
    }
  }

  return (
    <div className="space-y-5">
      {providers.length > 0 && capableCount === 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground"
        >
          <p className="font-medium text-destructive">No provider supports text-to-speech yet.</p>
          <p className="mt-1 text-muted-foreground">
            The built-in voice engine is always available — check the Providers view.
          </p>
        </div>
      )}

      <section className="space-y-2" aria-label="Text to speak">
        <div className="flex items-center justify-between">
          <Label htmlFor="fl-speech-text" className="micro-label">Text</Label>
          <span
            className={`text-[11px] ${speechText.length >= MAX_CHARS ? 'text-ember' : 'text-muted-foreground'}`}
            aria-live="polite"
          >
            {speechText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
        <Textarea
          id="fl-speech-text"
          value={speechText}
          maxLength={MAX_CHARS}
          onChange={(e) => set('speechText', e.target.value)}
          placeholder="Paste or write the narration here — long texts are chunked and stitched automatically…"
          className="min-h-32 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
        />
      </section>

      <section className="space-y-2" aria-label="Voice">
        <span className="micro-label">Voice</span>
        <Select value={speechVoice} onValueChange={(v) => set('speechVoice', v)}>
          <SelectTrigger className="w-full border-border text-xs" aria-label="Voice">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VOICES.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Seven built-in voices — tongtong warm · chuichui lively · xiaochen calm · jam british ·
          kazi clear · douji natural · luodo expressive.
        </p>
      </section>

      <section className="space-y-2.5 rounded-md border bg-secondary/30 p-3" aria-label="Speed">
        <div className="flex items-center justify-between">
          <span className="micro-label">Speed</span>
          <span className="font-mono text-xs text-muted-foreground">{speechSpeed.toFixed(1)}×</span>
        </div>
        <Slider
          value={[speechSpeed]}
          min={0.5}
          max={2}
          step={0.1}
          onValueChange={(v) => set('speechSpeed', v[0])}
          aria-label="Speech speed multiplier"
        />
      </section>

      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect capability={capability} value={providerMode} onChange={(v) => set('providerMode', v)} />
        </CollapsibleContent>
      </Collapsible>

      <p className="rounded-md border bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        {activeProvider?.id === 'builtin' || !activeProvider ? (
          <>
            <span className="text-foreground/90">Built-in voice engine — included.</span> 7 voices,
            chunked synthesis for long texts, WAV output. No key, no quota.
          </>
        ) : (
          activeProvider.note ?? activeProvider.description
        )}
      </p>

      {lastAudioUrl && (
        <section className="space-y-1.5" aria-label="Last result">
          <span className="micro-label">Last take</span>
          <audio controls src={lastAudioUrl} className="h-9 w-full" preload="metadata" />
        </section>
      )}

      <div className="space-y-2">
        <Button
          onClick={() => void onSpeak()}
          disabled={running || !speechText.trim()}
          className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing…
            </>
          ) : (
            <>
              <AudioLines className="h-4 w-4" /> Speak
            </>
          )}
        </Button>
        {running && jobId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs text-muted-foreground"
            onClick={() => cancelJob(jobId)}
          >
            Cancel (stops waiting)
          </Button>
        )}
      </div>
    </div>
  )
}

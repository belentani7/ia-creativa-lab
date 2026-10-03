'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Music, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFireLab } from '@/lib/firelab/store'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { postMusic } from '@/lib/firelab/api-client'
import { ProviderSelect, resolveAutoProvider } from '../provider-select'
import type { Capability, ProviderInfo } from '@/lib/firelab/types'

function onlyBuiltinMusic(providers: ProviderInfo[]): boolean {
  const capable = providers.filter((p) => p.capabilities.textToMusic && p.configured)
  return capable.length > 0 && capable.every((p) => p.id === 'builtin')
}

export function MusicPanel() {
  const prompt = useFireLab((s) => s.prompt)
  const musicDurationSec = useFireLab((s) => s.musicDurationSec)
  const musicCount = useFireLab((s) => s.musicCount)
  const seed = useFireLab((s) => s.seed)
  const providers = useFireLab((s) => s.providers)
  const providerMode = useFireLab((s) => s.providerMode)
  const projectId = useFireLab((s) => s.projectId)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const capability: Capability = 'textToMusic'
  const activeProvider =
    providerMode === 'auto'
      ? resolveAutoProvider(providers, capability)
      : providers.find((p) => p.id === providerMode) ?? null
  const capableCount = providers.filter((p) => p.capabilities[capability]).length
  const showSeed = !!activeProvider?.capabilities.seed
  const proceduralOnly = onlyBuiltinMusic(providers)

  const onGenerate = async () => {
    if (running || !prompt.trim()) return
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'music',
        label: 'Text → Music',
        prompt: prompt.trim() || undefined,
        fn: async (signal) =>
          toJobResult(
            await postMusic(
              {
                prompt,
                durationSec: musicDurationSec,
                count: musicCount,
                seed: showSeed ? (seed ?? undefined) : undefined,
                mode: providerMode === 'auto' ? 'auto' : 'manual',
                ...(providerMode !== 'auto' ? { providerId: providerMode } : {}),
                projectId,
              },
              signal
            )
          ),
        onDone: (res) => {
          toast.success('Music generated', {
            description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s · ${musicDurationSec} s clip — plays in the history strip below.`,
          })
        },
      })
    } catch (err) {
      toast.error('Music generation failed', {
        description: err instanceof Error ? err.message : 'All music providers failed — see History for details.',
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
          <p className="font-medium text-destructive">No provider supports text-to-music yet.</p>
          <p className="mt-1 text-muted-foreground">
            The built-in synth is always available — check the Providers view if it is missing.
          </p>
        </div>
      )}

      <section className="space-y-2" aria-label="Prompt">
        <div className="flex items-center justify-between">
          <Label htmlFor="fl-music-prompt" className="micro-label">Prompt</Label>
          <span className="text-[11px] text-muted-foreground">{prompt.trim().length} chars</span>
        </div>
        <Textarea
          id="fl-music-prompt"
          value={prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="A mood and its parts — 'slow ominous synthwave, G minor, 75 bpm, tape hiss, sparse drums'…"
          className="min-h-24 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
        />
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Key, mode, tempo and texture words steer the synth — the parser reads them.
        </p>
      </section>

      <section className="space-y-2.5 rounded-md border bg-secondary/30 p-3" aria-label="Clip length">
        <div className="flex items-center justify-between">
          <span className="micro-label">Length</span>
          <span className="font-mono text-xs text-muted-foreground">{musicDurationSec} s</span>
        </div>
        <Slider
          value={[musicDurationSec]}
          min={5}
          max={120}
          step={1}
          onValueChange={(v) => set('musicDurationSec', v[0])}
          aria-label="Clip length in seconds"
        />
      </section>

      <section className="space-y-2" aria-label="Track count">
        <span className="micro-label">Tracks</span>
        <ToggleGroup
          type="single"
          value={String(musicCount)}
          onValueChange={(v) => v && set('musicCount', Number(v))}
          className="gap-1.5"
        >
          {[1, 2, 3, 4].map((n) => (
            <ToggleGroupItem
              key={n}
              value={String(n)}
              className="h-7 w-9 text-xs data-[state=on]:bg-accent data-[state=on]:text-ember"
            >
              {n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect capability={capability} value={providerMode} onChange={(v) => set('providerMode', v)} />
          {showSeed && (
            <div className="space-y-1.5">
              <Label htmlFor="fl-music-seed" className="micro-label">Seed (optional)</Label>
              <Input
                id="fl-music-seed"
                type="number"
                value={seed ?? ''}
                onChange={(e) => set('seed', e.target.value ? Number(e.target.value) : null)}
                placeholder="random"
                className="h-8 border-border bg-secondary/30 text-xs"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <p className="rounded-md border bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        {proceduralOnly ? (
          <>
            <span className="text-foreground/90">Procedural synth — rule-based local synthesis, not a neural model.</span>{' '}
            Replicate (meta/musicgen) activates with a key.
          </>
        ) : activeProvider ? (
          activeProvider.note ?? activeProvider.description
        ) : (
          'AUTO picks the first configured music engine.'
        )}
      </p>

      <div className="space-y-2">
        <Button
          onClick={() => void onGenerate()}
          disabled={running || !prompt.trim()}
          className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing…
            </>
          ) : (
            <>
              <Music className="h-4 w-4" /> Generate Music
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

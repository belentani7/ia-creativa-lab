'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Expand, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { editImage, assetToDataUrl } from '@/lib/firelab/api-client'
import { ProviderSelect, CapabilityNotice } from '../provider-select'
import type { Capability } from '@/lib/firelab/types'

const DIRECTIONS: { id: 'all' | 'h' | 'v'; label: string }[] = [
  { id: 'all', label: 'All sides' },
  { id: 'h', label: 'Horizontal' },
  { id: 'v', label: 'Vertical' },
]

export function ExpandPanel() {
  const prompt = useFireLab((s) => s.prompt)
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const count = useFireLab((s) => s.count)
  const preserveUnmasked = useFireLab((s) => s.preserveUnmasked)
  const providerMode = useFireLab((s) => s.providerMode)
  const providers = useFireLab((s) => s.providers)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const expandDirection = useFireLab((s) => s.expandDirection)
  const expandAmount = useFireLab((s) => s.expandAmount)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const onRun = async () => {
    if (running || !imageLoaded) return
    const engine = getEngine()
    // 1) grow the canvas locally + mark the new border
    const ok = engine.expandCanvas(expandDirection, expandAmount)
    if (!ok) return
    // 2) send the marked image for outpainting
    const { dataUrl } = engine.compositeForEdit()
    const size = engine.imageSize()
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'expand',
        label: `Expand ${expandDirection} +${expandAmount}px`,
        fn: async (signal) =>
          toJobResult(
            await editImage(
              {
                providerId: providerMode,
                mode: 'expand',
                image: dataUrl,
                instruction: prompt,
                hasMask: true,
                width: size.width,
                height: size.height,
                count: 1,
                projectId,
                allowDemo,
              },
              signal
            )
          ),
        onDone: async (res) => {
          if (res.demo) {
            toast.warning('DEMO RESULT', { description: 'Deterministic placeholder — not AI.' })
          } else {
            toast.success('Scene expanded', {
              description: `${res.providerId} · new canvas ${size.width} × ${size.height}.`,
            })
          }
          if (res.results[0]) {
            try {
              const url = await assetToDataUrl(res.results[0].url)
              await engine.applyResult(url, { preserveUnmasked })
            } catch {
              // manual apply available
            }
          }
        },
      })
    } catch (err) {
      toast.error('Expand failed', {
        description: err instanceof Error ? err.message : 'All providers failed. You can undo the canvas growth (Ctrl+Z).',
      })
    } finally {
      setRunning(false)
      setJobId(null)
    }
  }

  const extraWidth = expandDirection === 'v' ? 0 : expandAmount * 2
  const extraHeight = expandDirection === 'h' ? 0 : expandAmount * 2

  return (
    <div className="space-y-5">
      {!imageLoaded && (
        <div className="rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          Load or generate an image first.
        </div>
      )}

      <section className="space-y-2" aria-label="Expansion direction">
        <span className="micro-label">Direction</span>
        <ToggleGroup
          type="single"
          value={expandDirection}
          onValueChange={(v) => v && set('expandDirection', v)}
          className="gap-1.5"
        >
          {DIRECTIONS.map((d) => (
            <ToggleGroupItem
              key={d.id}
              value={d.id}
              className="h-7 px-2.5 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember"
            >
              {d.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className="space-y-2" aria-label="Expansion amount">
        <div className="flex items-center justify-between">
          <span className="micro-label">Amount per side</span>
          <span className="font-mono text-xs text-muted-foreground">{expandAmount} px</span>
        </div>
        <Slider
          value={[expandAmount]}
          min={64}
          max={512}
          step={32}
          onValueChange={(v) => set('expandAmount', v[0])}
          aria-label="Expansion amount in pixels"
        />
        <p className="font-mono text-[11px] text-muted-foreground">
          canvas grows by {extraWidth} × {extraHeight} px (border is marked, model continues the scene)
        </p>
      </section>

      <section className="space-y-2" aria-label="Continuation prompt">
        <Label htmlFor="fl-expand-prompt" className="micro-label">
          Continuation (optional)
        </Label>
        <Textarea
          id="fl-expand-prompt"
          value={prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="e.g. continue the foggy forest, same light and mood"
          className="min-h-16 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
        />
      </section>

      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect capability={'outpainting' as Capability} value={providerMode} onChange={(v) => set('providerMode', v)} />
          <CapabilityNotice
            providers={providers}
            providerMode={providerMode}
            capability={'outpainting'}
            label="Generative Expand"
          />
          <div className="flex items-center justify-between gap-3 rounded-md border bg-secondary/30 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="fl-preserve-expand" className="text-xs">Keep center pixel-identical</Label>
              <p className="text-[11px] text-muted-foreground">Only the new border comes from the model.</p>
            </div>
            <Switch
              id="fl-preserve-expand"
              checked={preserveUnmasked}
              onCheckedChange={(v) => set('preserveUnmasked', v)}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={() => void onRun()}
        disabled={running || !imageLoaded}
        className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Expanding…
          </>
        ) : (
          <>
            <Expand className="h-4 w-4" /> Expand Scene
          </>
        )}
      </Button>
      {running && jobId && (
        <Button variant="ghost" size="sm" className="h-8 w-full text-xs text-muted-foreground" onClick={() => cancelJob(jobId)}>
          Cancel (stops waiting)
        </Button>
      )}
    </div>
  )
}

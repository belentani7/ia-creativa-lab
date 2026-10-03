'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { editImage } from '@/lib/firelab/api-client'
import { ProviderSelect, CapabilityNotice } from '../provider-select'
import type { Capability } from '@/lib/firelab/types'

const STRENGTH = [
  { id: 'subtle', label: 'Subtle', suffix: 'keep it very close to the original, minimal changes' },
  { id: 'moderate', label: 'Moderate', suffix: 'a clear reinterpretation, same identity and mood' },
  { id: 'bold', label: 'Bold', suffix: 'a bold reinterpretation, keep only the core concept' },
] as const

export function VariationsPanel() {
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const variationsGuidance = useFireLab((s) => s.variationsGuidance)
  const count = useFireLab((s) => s.count)
  const providerMode = useFireLab((s) => s.providerMode)
  const providers = useFireLab((s) => s.providers)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const set = useFireLab((s) => s.set)
  const [strength, setStrength] = useState<string>('moderate')

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const onRun = async () => {
    if (running || !imageLoaded) return
    const engine = getEngine()
    const { dataUrl } = engine.compositeForEdit()
    const size = engine.imageSize()
    const suffix = STRENGTH.find((s) => s.id === strength)?.suffix ?? ''
    const instruction = [variationsGuidance.trim(), suffix].filter(Boolean).join(', ')
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'variations',
        label: instruction.slice(0, 60) || 'Variations',
        fn: async (signal) =>
          toJobResult(
            await editImage(
              {
                providerId: providerMode,
                mode: 'variations',
                image: dataUrl,
                instruction,
                hasMask: false,
                width: size.width,
                height: size.height,
                count,
                projectId,
                allowDemo,
              },
              signal
            )
          ),
        onDone: (res) => {
          toast.success(`${res.results.length} variation${res.results.length > 1 ? 's' : ''} ready`, {
            description: 'Click a thumbnail in the strip below to open it on the canvas.',
          })
        },
      })
    } catch (err) {
      toast.error('Variations failed', {
        description: err instanceof Error ? err.message : 'All providers failed.',
      })
    } finally {
      setRunning(false)
      setJobId(null)
    }
  }

  return (
    <div className="space-y-5">
      {!imageLoaded && (
        <div className="rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          Load or generate an image first.
        </div>
      )}

      <section className="space-y-2" aria-label="Variation guidance">
        <Label htmlFor="fl-var-prompt" className="micro-label">Guidance (optional)</Label>
        <Textarea
          id="fl-var-prompt"
          value={variationsGuidance}
          onChange={(e) => set('variationsGuidance', e.target.value)}
          placeholder="e.g. try warmer tones, different wardrobe, same framing"
          className="min-h-16 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
        />
      </section>

      <section className="space-y-2" aria-label="Strength">
        <span className="micro-label">Strength</span>
        <Select value={strength} onValueChange={setStrength}>
          <SelectTrigger className="w-full border-border text-xs" aria-label="Variation strength">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STRENGTH.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      <section className="space-y-2" aria-label="Count">
        <span className="micro-label">Variations</span>
        <ToggleGroup
          type="single"
          value={String(count)}
          onValueChange={(v) => v && set('count', Number(v))}
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
          <ProviderSelect capability={'variations' as Capability} value={providerMode} onChange={(v) => set('providerMode', v)} includeDemo />
          <CapabilityNotice
            providers={providers}
            providerMode={providerMode}
            capability={'variations'}
            label="Variations"
          />
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={() => void onRun()}
        disabled={running || !imageLoaded}
        className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Exploring…
          </>
        ) : (
          <>
            <Shuffle className="h-4 w-4" /> Create Variations
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

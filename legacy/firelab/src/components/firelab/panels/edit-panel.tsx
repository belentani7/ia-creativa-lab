'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Brush, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import type { EditMode } from '@/lib/firelab/prompt'

export function EditPanel({ mode }: { mode: 'fill' | 'remove' }) {
  const isFill = mode === 'fill'
  const capability: Capability = isFill ? 'inpainting' : 'removeObject'

  const prompt = useFireLab((s) => s.prompt)
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const hasMask = useFireLab((s) => s.editor.hasMask)
  const count = useFireLab((s) => s.count)
  const preserveUnmasked = useFireLab((s) => s.preserveUnmasked)
  const providerMode = useFireLab((s) => s.providerMode)
  const providers = useFireLab((s) => s.providers)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const setMaskActive = useFireLab((s) => s.setMaskActive)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const onRun = async () => {
    if (running || !imageLoaded) return
    if (!hasMask) {
      toast.error('A mask is required', {
        description: 'Paint over the region you want to edit (press B for the brush).',
      })
      return
    }
    const engine = getEngine()
    const { dataUrl, hasMask: maskPresent } = engine.compositeForEdit()
    const size = engine.imageSize()
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: mode,
        label: isFill ? prompt.slice(0, 60) || 'Generative fill' : 'Remove object',
        fn: async (signal) =>
          toJobResult(
            await editImage(
              {
                providerId: providerMode,
                mode: mode as EditMode,
                image: dataUrl,
                instruction: isFill ? prompt : '',
                hasMask: maskPresent,
                width: size.width,
                height: size.height,
                count,
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
            toast.success(`${mode} complete`, {
              description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s · click thumbnails below to compare.`,
            })
          }
          if (res.results[0]) {
            try {
              const url = await assetToDataUrl(res.results[0].url)
              await engine.applyResult(url, { preserveUnmasked })
            } catch {
              // manual apply remains available
            }
          }
        },
      })
    } catch (err) {
      toast.error(`${isFill ? 'Fill' : 'Remove'} failed`, {
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
        <div role="alert" className="flex gap-2 rounded-md border border-amber-600/30 bg-amber-500/10 px-3 py-2 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
          <p>Load or generate an image first.</p>
        </div>
      )}

      {imageLoaded && !hasMask && (
        <div role="alert" className="rounded-md border border-ember/40 bg-accent/50 px-3 py-2.5 text-xs">
          <p className="text-foreground">Paint a mask over the area to {isFill ? 'fill' : 'remove'}.</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 h-8 gap-1.5 text-xs"
            onClick={() => setMaskActive(true)}
          >
            <Brush className="h-3.5 w-3.5" /> Activate brush (B)
          </Button>
        </div>
      )}

      {imageLoaded && hasMask && (
        <div className="rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="text-foreground/90">Mask ready.</span>{' '}
          <button type="button" className="text-ember underline-offset-2 hover:underline" onClick={() => setMaskActive(true)}>
            Refine it (B)
          </button>{' '}
          — the orange overlay marks the edit region.
        </div>
      )}

      {isFill && (
        <section className="space-y-2" aria-label="Fill prompt">
          <Label htmlFor="fl-fill-prompt" className="micro-label">
            What should appear here?
          </Label>
          <Textarea
            id="fl-fill-prompt"
            value={prompt}
            onChange={(e) => set('prompt', e.target.value)}
            placeholder="e.g. wild dark roses with dew, soft studio light"
            className="min-h-20 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
          />
        </section>
      )}

      <section className="space-y-2" aria-label="Results count">
        <span className="micro-label">Options</span>
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
          <ProviderSelect capability={capability} value={providerMode} onChange={(v) => set('providerMode', v)} />
          <CapabilityNotice
            providers={providers}
            providerMode={providerMode}
            capability={capability}
            label={isFill ? 'Generative Fill' : 'Remove Object'}
          />
          <div className="flex items-center justify-between gap-3 rounded-md border bg-secondary/30 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="fl-preserve" className="text-xs text-foreground">Preserve unmasked pixels</Label>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Keep everything outside the mask pixel-identical (feathered seam).
              </p>
            </div>
            <Switch
              id="fl-preserve"
              checked={preserveUnmasked}
              onCheckedChange={(v) => set('preserveUnmasked', v)}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            How it works: the mask is sent to the engine as a solid magenta region marker (the built-in
            edit API takes image + instruction, not raw masks). The instruction explicitly bounds the edit;
            “preserve unmasked” then re-composites the original pixels locally.
          </p>
        </CollapsibleContent>
      </Collapsible>

      <Button
        onClick={() => void onRun()}
        disabled={running || !imageLoaded || !hasMask || (isFill && !prompt.trim())}
        className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
      >
        {running ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Working…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> {isFill ? 'Generate Fill' : 'Remove Object'}
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

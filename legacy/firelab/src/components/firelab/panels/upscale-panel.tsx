'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Scaling } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { editImage, assetToDataUrl } from '@/lib/firelab/api-client'
import { ProviderSelect, CapabilityNotice } from '../provider-select'
import type { Capability } from '@/lib/firelab/types'

type Method = 'local' | 'ai'

export function UpscalePanel() {
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const prompt = useFireLab((s) => s.prompt)
  const providerMode = useFireLab((s) => s.providerMode)
  const providers = useFireLab((s) => s.providers)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const upscaleFactor = useFireLab((s) => s.upscaleFactor)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [method, setMethod] = useState<Method>('local')
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)

  const size = useFireLab((s) => s.editor.imageSize)

  const runLocal = () => {
    const engine = getEngine()
    if (!engine.hasImage()) return
    const before = engine.imageSize()
    const ok = engine.upscaleLocal(upscaleFactor)
    if (ok) {
      const after = engine.imageSize()
      toast.success('Upscaled locally', {
        description: `${before.width} × ${before.height} → ${after.width} × ${after.height} px (stepwise resample + unsharp). Free, deterministic, no AI.`,
      })
    }
  }

  const runAi = async () => {
    if (running || !imageLoaded) return
    const engine = getEngine()
    const { dataUrl } = engine.compositeForEdit()
    const dims = engine.imageSize()
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'refine',
        label: 'AI refinement pass',
        fn: async (signal) =>
          toJobResult(
            await editImage(
              {
                providerId: providerMode,
                mode: 'refine',
                image: dataUrl,
                instruction: prompt,
                hasMask: false,
                width: dims.width,
                height: dims.height,
                count: 1,
                projectId,
                allowDemo,
              },
              signal
            )
          ),
        onDone: async (res) => {
          if (res.results[0]) {
            const url = await assetToDataUrl(res.results[0].url)
            await engine.applyResult(url, { preserveUnmasked: false })
            toast.success('AI refinement applied', {
              description: `${res.providerId} · the whole image is re-rendered — compare with hold-C.`,
            })
          }
        },
      })
    } catch (err) {
      toast.error('AI refinement failed', {
        description: err instanceof Error ? err.message : 'The local method always works.',
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

      <section className="space-y-2" aria-label="Method">
        <span className="micro-label">Method</span>
        <ToggleGroup
          type="single"
          value={method}
          onValueChange={(v) => v && setMethod(v as Method)}
          className="gap-1.5"
        >
          <ToggleGroupItem value="local" className="h-7 px-3 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember">
            Local · instant
          </ToggleGroupItem>
          <ToggleGroupItem value="ai" className="h-7 px-3 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember">
            AI · refine pass
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {method === 'local'
            ? 'High-quality stepwise resampling + unsharp mask, computed in your browser. Deterministic and free.'
            : 'Re-renders the image through an edit model with a refine instruction — richer micro-detail, but pixels change. Engines cap at ~1440px, so combine with Local for size.'}
        </p>
      </section>

      {method === 'local' ? (
        <section className="space-y-2" aria-label="Factor">
          <span className="micro-label">Factor</span>
          <ToggleGroup
            type="single"
            value={String(upscaleFactor)}
            onValueChange={(v) => v && set('upscaleFactor', Number(v) as 2 | 3)}
            className="gap-1.5"
          >
            {[2, 3].map((n) => (
              <ToggleGroupItem
                key={n}
                value={String(n)}
                className="h-7 w-12 text-xs data-[state=on]:bg-accent data-[state=on]:text-ember"
              >
                {n}×
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {size && (
            <p className="font-mono text-[11px] text-muted-foreground">
              {size.width} × {size.height} → {size.width * upscaleFactor} × {size.height * upscaleFactor} px
            </p>
          )}
          <Button
            onClick={runLocal}
            disabled={!imageLoaded}
            className="mt-2 h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
          >
            <Scaling className="h-4 w-4" /> Upscale {upscaleFactor}× (local)
          </Button>
        </section>
      ) : (
        <>
          <section className="space-y-2" aria-label="Refinement guidance">
            <Label htmlFor="fl-refine-prompt" className="micro-label">Refinement guidance (optional)</Label>
            <Textarea
              id="fl-refine-prompt"
              value={prompt}
              onChange={(e) => set('prompt', e.target.value)}
              placeholder="e.g. recover fine textures, keep the film grain"
              className="min-h-16 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
            />
          </section>
          <Collapsible>
            <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
              <span className="micro-label">Advanced</span>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <ProviderSelect capability={'imageToImage' as Capability} value={providerMode} onChange={(v) => set('providerMode', v)} />
              <CapabilityNotice
                providers={providers}
                providerMode={providerMode}
                capability={'imageToImage'}
                label="AI refinement"
              />
            </CollapsibleContent>
          </Collapsible>
          <Button
            onClick={() => void runAi()}
            disabled={running || !imageLoaded}
            className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Refining…
              </>
            ) : (
              <>
                <Scaling className="h-4 w-4" /> AI Refinement Pass
              </>
            )}
          </Button>
          {running && jobId && (
            <Button variant="ghost" size="sm" className="h-8 w-full text-xs text-muted-foreground" onClick={() => cancelJob(jobId)}>
              Cancel (stops waiting)
            </Button>
          )}
        </>
      )}
    </div>
  )
}

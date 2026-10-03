'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { editImage, assetToDataUrl } from '@/lib/firelab/api-client'
import { ProviderSelect, CapabilityNotice } from '../provider-select'
import { chromaKey, loadImageElement } from '@/lib/firelab/imageops'
import type { Capability } from '@/lib/firelab/types'

/**
 * Background tool.
 * - AI mode: the engine isolates the subject on chroma green, then the browser
 *   keys it out locally (tolerance/feather) → transparent PNG.
 * - Local mode: border-color keying on the current image (approximate).
 */
export function BackgroundPanel() {
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const backgroundPrompt = useFireLab((s) => s.backgroundPrompt)
  const backgroundMethod = useFireLab((s) => s.backgroundMethod)
  const tolerance = useFireLab((s) => s.tolerance)
  const feather = useFireLab((s) => s.feather)
  const providerMode = useFireLab((s) => s.providerMode)
  const providers = useFireLab((s) => s.providers)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [source, setSource] = useState<{ dataUrl: string; mode: 'green' | 'border' } | null>(null)
  const debounceRef = useRef<number | null>(null)

  // re-key preview when tolerance/feather change (debounced)
  useEffect(() => {
    if (!source) return
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => void applyKey(source, false), 140)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [tolerance, feather])

  const applyKey = useCallback(
    async (src: { dataUrl: string; mode: 'green' | 'border' }, pushHistory: boolean) => {
      const engine = getEngine()
      const img = await loadImageElement(src.dataUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
      chromaKey(data, { mode: src.mode, tolerance, feather })
      ctx.putImageData(data, 0, 0)
      if (pushHistory) {
        await engine.loadImageFromDataUrl(canvas.toDataURL('image/png'), { keepOriginal: true })
      } else {
        engine.setProcessedImage(canvas, { keepOriginal: true })
      }
    },
    [tolerance, feather]
  )

  const runAi = async () => {
    if (running || !imageLoaded) return
    const engine = getEngine()
    const { dataUrl } = engine.compositeForEdit()
    const size = engine.imageSize()
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'background',
        label: backgroundPrompt.trim() ? `Background: ${backgroundPrompt.slice(0, 40)}` : 'Background removal',
        fn: async (signal) =>
          toJobResult(
            await editImage(
              {
                providerId: providerMode,
                mode: 'background',
                image: dataUrl,
                instruction: backgroundPrompt,
                hasMask: false,
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
          if (backgroundPrompt.trim()) {
            // background replacement: apply the composite directly
            if (res.results[0]) {
              const url = await assetToDataUrl(res.results[0].url)
              await engine.loadImageFromDataUrl(url, { keepOriginal: true })
              toast.success('Background replaced', { description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s` })
            }
          } else {
            // removal: result has subject on chroma green → key it out
            if (res.results[0]) {
              const url = await assetToDataUrl(res.results[0].url)
              setSource({ dataUrl: url, mode: 'green' })
              await applyKey({ dataUrl: url, mode: 'green' }, true)
              toast.success('Background removed', {
                description: 'AI placed the subject on green, keyed out locally. Tune tolerance below — export as PNG for transparency.',
              })
            }
          }
        },
      })
    } catch (err) {
      toast.error('Background AI failed', {
        description: err instanceof Error ? err.message : 'Try the local method below.',
      })
    } finally {
      setRunning(false)
      setJobId(null)
    }
  }

  const runLocal = async () => {
    if (!imageLoaded) return
    const engine = getEngine()
    const dataUrl = engine.getImageDataUrl('image/png')
    setSource({ dataUrl, mode: 'border' })
    await applyKey({ dataUrl, mode: 'border' }, true)
    toast.info('Local key applied', {
      description: 'Approximate: keys the average border color. Works best on clean backgrounds — no AI involved.',
    })
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
          value={backgroundMethod}
          onValueChange={(v) => v && set('backgroundMethod', v)}
          className="gap-1.5"
        >
          <ToggleGroupItem value="ai" className="h-7 px-3 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember">
            AI · chroma pipeline
          </ToggleGroupItem>
          <ToggleGroupItem value="local" className="h-7 px-3 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember">
            Local · approximate
          </ToggleGroupItem>
        </ToggleGroup>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {backgroundMethod === 'ai'
            ? 'The engine puts the subject on a flat chroma-green backdrop, then your browser keys it out — real transparency, deterministic finish.'
            : 'Border-color keying computed entirely in your browser. No AI, instant, approximate — best on uniform backgrounds.'}
        </p>
      </section>

      {backgroundMethod === 'ai' && (
        <section className="space-y-2" aria-label="Background prompt">
          <Label htmlFor="fl-bg-prompt" className="micro-label">
            New background (empty = remove)
          </Label>
          <Textarea
            id="fl-bg-prompt"
            value={backgroundPrompt}
            onChange={(e) => set('backgroundPrompt', e.target.value)}
            placeholder="e.g. a dark marble studio backdrop — leave empty to cut out to transparent"
            className="min-h-16 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
          />
        </section>
      )}

      {(source || backgroundMethod === 'local') && (
        <section className="space-y-3 rounded-md border bg-secondary/30 p-3" aria-label="Key settings">
          <div className="flex items-center justify-between">
            <span className="micro-label">Tolerance</span>
            <span className="font-mono text-xs text-muted-foreground">{tolerance}</span>
          </div>
          <Slider
            value={[tolerance]}
            min={5}
            max={100}
            step={1}
            onValueChange={(v) => set('tolerance', v[0])}
            onValueCommit={() => source && void applyKey(source, true)}
            aria-label="Key tolerance"
          />
          <div className="flex items-center justify-between">
            <span className="micro-label">Edge feather</span>
            <span className="font-mono text-xs text-muted-foreground">{feather} px</span>
          </div>
          <Slider
            value={[feather]}
            min={0}
            max={10}
            step={1}
            onValueChange={(v) => set('feather', v[0])}
            onValueCommit={() => source && void applyKey(source, true)}
            aria-label="Edge feather in pixels"
          />
          <p className="text-[11px] text-muted-foreground">
            The canvas shows a checkerboard where pixels became transparent.
          </p>
        </section>
      )}

      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect capability={'removeBackground' as Capability} value={providerMode} onChange={(v) => set('providerMode', v)} />
          <CapabilityNotice
            providers={providers}
            providerMode={providerMode}
            capability={'removeBackground'}
            label="Background tools"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            AI mode = one edit pass + local keying. The model never sees a mask; “remove” asks for a flat
            green chroma backdrop and your GPU-less browser does the rest deterministically.
          </p>
        </CollapsibleContent>
      </Collapsible>

      {backgroundMethod === 'ai' ? (
        <>
          <Button
            onClick={() => void runAi()}
            disabled={running || !imageLoaded}
            className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" /> {backgroundPrompt.trim() ? 'Replace Background' : 'Remove Background'}
              </>
            )}
          </Button>
          {running && jobId && (
            <Button variant="ghost" size="sm" className="h-8 w-full text-xs text-muted-foreground" onClick={() => cancelJob(jobId)}>
              Cancel (stops waiting)
            </Button>
          )}
        </>
      ) : (
        <Button
          onClick={() => void runLocal()}
          disabled={!imageLoaded}
          variant="secondary"
          className="h-11 w-full gap-2 text-sm"
        >
          <Wand2 className="h-4 w-4 text-ember" /> Key Out Background (local)
        </Button>
      )}
    </div>
  )
}

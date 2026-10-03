'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Clapperboard, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { postVideo } from '@/lib/firelab/api-client'
import { ProviderSelect, resolveAutoProvider } from '../provider-select'
import type { Capability } from '@/lib/firelab/types'

const VIDEO_SIZES = [
  { id: '1024x576', label: '16:9', w: 1024, h: 576 },
  { id: '576x1024', label: '9:16', w: 576, h: 1024 },
  { id: '768x768', label: '1:1', w: 768, h: 768 },
] as const

/** Scaled-down live snapshot of the canvas (start frame preview). */
function CanvasSnapshot({ revision }: { revision: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const src = getEngine().getImageCanvas()
    if (src.width <= 8 || src.height <= 8) return
    const scale = Math.min(272 / src.width, 148 / src.height, 1)
    c.width = Math.max(1, Math.round(src.width * scale))
    c.height = Math.max(1, Math.round(src.height * scale))
    const ctx = c.getContext('2d')
    if (ctx) ctx.drawImage(src, 0, 0, c.width, c.height)
  }, [revision])
  return (
    <canvas
      ref={ref}
      aria-label="Current canvas image (start frame)"
      className="max-h-36 w-auto max-w-full rounded-md border border-border bg-secondary/40"
    />
  )
}

export function VideoPanel({ variant }: { variant: 'text-to-video' | 'image-to-video' }) {
  const isI2V = variant === 'image-to-video'
  const prompt = useFireLab((s) => s.prompt)
  const videoSize = useFireLab((s) => s.videoSize)
  const videoDurationSec = useFireLab((s) => s.videoDurationSec)
  const videoCount = useFireLab((s) => s.videoCount)
  const seed = useFireLab((s) => s.seed)
  const providers = useFireLab((s) => s.providers)
  const providerMode = useFireLab((s) => s.providerMode)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const imageSize = useFireLab((s) => s.editor.imageSize)
  const canUndo = useFireLab((s) => s.editor.canUndo)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  const capability: Capability = isI2V ? 'imageToVideo' : 'textToVideo'
  const activeProvider =
    providerMode === 'auto'
      ? resolveAutoProvider(providers, capability)
      : providers.find((p) => p.id === providerMode) ?? null
  const capableCount = providers.filter((p) => p.capabilities[capability]).length
  const showSeed = !!activeProvider?.capabilities.seed
  const size = VIDEO_SIZES.find((s) => s.id === videoSize) ?? VIDEO_SIZES[0]

  // live snapshot revision — redraw when the image itself changes, not on zoom
  const revision = `${imageLoaded}:${imageSize?.width ?? 0}x${imageSize?.height ?? 0}:${canUndo}`

  useEffect(() => {
    if (!running) return
    const started = Date.now()
    setElapsed(0)
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - started) / 1000)),
      1000
    )
    return () => window.clearInterval(timer)
  }, [running])

  const onGenerate = async () => {
    if (running || !prompt.trim()) return
    if (isI2V && !imageLoaded) return
    const engine = getEngine()
    const image = isI2V ? engine.getImageDataUrl('image/jpeg', 0.92) : undefined
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: variant,
        label: isI2V ? 'Image → Video' : 'Text → Video',
        prompt: prompt.trim() || undefined,
        fn: async (signal) =>
          toJobResult(
            await postVideo(
              {
                prompt,
                ...(image ? { image } : {}),
                size: videoSize,
                durationSec: videoDurationSec,
                count: videoCount,
                seed: showSeed ? (seed ?? undefined) : undefined,
                mode: providerMode === 'auto' ? 'auto' : 'manual',
                ...(providerMode !== 'auto' ? { providerId: providerMode } : {}),
                projectId,
                allowDemo,
              },
              signal
            )
          ),
        onDone: (res) => {
          if (res.demo) {
            toast.warning('DEMO VIDEO', {
              description:
                'All real video providers failed — this is a labeled animated-GIF placeholder, not AI video. It plays in the history strip below.',
            })
          } else {
            toast.success('Video ready', {
              description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s · ${res.results.length} clip${res.results.length > 1 ? 's' : ''} — plays in the history strip below.`,
            })
          }
        },
      })
    } catch (err) {
      toast.error('Video generation failed', {
        description:
          err instanceof Error ? err.message : 'All video providers failed — see History for details.',
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
          <p className="font-medium text-destructive">No provider supports {isI2V ? 'image-to-video' : 'text-to-video'} yet.</p>
          <p className="mt-1 text-muted-foreground">
            Check the Providers view — a video-capable engine must be configured.
          </p>
        </div>
      )}

      {isI2V && (
        <section className="space-y-2" aria-label="Start frame">
          <span className="micro-label">Start frame</span>
          {imageLoaded ? (
            <>
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 p-2">
                <CanvasSnapshot revision={revision} />
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Uses the current canvas image as the start frame — the first frame of the clip is
                exactly what you see.
              </p>
            </>
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 text-xs text-muted-foreground">
              Load an image on the canvas first.
            </div>
          )}
        </section>
      )}

      <section className="space-y-2" aria-label="Prompt">
        <div className="flex items-center justify-between">
          <Label htmlFor="fl-video-prompt" className="micro-label">Prompt</Label>
          <span className="text-[11px] text-muted-foreground">{prompt.trim().length} chars</span>
        </div>
        <Textarea
          id="fl-video-prompt"
          value={prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder={
            isI2V
              ? 'How the shot moves — camera push-in, subject turns, embers drift…'
              : 'A cinematic shot — describe subject, motion, camera move, light…'
          }
          className="min-h-24 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
        />
      </section>

      <section className="space-y-2" aria-label="Aspect ratio">
        <span className="micro-label">Aspect ratio</span>
        <ToggleGroup
          type="single"
          value={videoSize}
          onValueChange={(v) => v && set('videoSize', v)}
          className="flex flex-wrap justify-start gap-1.5"
        >
          {VIDEO_SIZES.map((s) => (
            <ToggleGroupItem
              key={s.id}
              value={s.id}
              className="h-7 px-3 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember"
            >
              {s.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="font-mono text-[11px] text-muted-foreground">
          output {size.w} × {size.h} px
        </p>
      </section>

      <section className="space-y-2" aria-label="Clip duration">
        <span className="micro-label">Duration</span>
        <ToggleGroup
          type="single"
          value={String(videoDurationSec)}
          onValueChange={(v) => v && set('videoDurationSec', Number(v))}
          className="gap-1.5"
        >
          {[5, 10].map((n) => (
            <ToggleGroupItem
              key={n}
              value={String(n)}
              className="h-7 px-4 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember"
            >
              {n} s
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <section className="space-y-2" aria-label="Clip count">
        <span className="micro-label">Clips</span>
        <ToggleGroup
          type="single"
          value={String(videoCount)}
          onValueChange={(v) => v && set('videoCount', Number(v))}
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
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Each clip renders sequentially — 15–180 s per clip with the built-in engine.
        </p>
      </section>

      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect
            capability={capability}
            value={providerMode}
            onChange={(v) => set('providerMode', v)}
            includeDemo={!isI2V}
          />
          {showSeed && (
            <div className="space-y-1.5">
              <Label htmlFor="fl-video-seed" className="micro-label">Seed (optional)</Label>
              <Input
                id="fl-video-seed"
                type="number"
                value={seed ?? ''}
                onChange={(e) => set('seed', e.target.value ? Number(e.target.value) : null)}
                placeholder="random"
                className="h-8 border-border bg-secondary/30 text-xs"
              />
            </div>
          )}
          {isI2V && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Built-in image-to-video is experimental — the engine may reject some start frames.
              Cloud providers (fal / Replicate) accept the same start frame and activate with a key.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      <p className="rounded-md border bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        {activeProvider?.id === 'builtin' || !activeProvider ? (
          <>
            <span className="text-foreground/90">Built-in engine — cogvideox-3, included.</span>{' '}
            Video renders server-side (15–180 s). The DEMO engine can stand in with a labeled GIF.
          </>
        ) : (
          activeProvider.note ?? activeProvider.description
        )}
      </p>

      <div className="space-y-2">
        <Button
          onClick={() => void onGenerate()}
          disabled={running || !prompt.trim() || (isI2V && !imageLoaded)}
          className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Rendering… {elapsed}s
            </>
          ) : (
            <>
              <Clapperboard className="h-4 w-4" /> {isI2V ? 'Animate Image' : 'Generate Video'}
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
            Cancel (stops waiting — the server may still finish)
          </Button>
        )}
        {running && (
          <p className="text-center text-[11px] text-muted-foreground" aria-live="polite">
            Long job — video synthesis can take up to 3 minutes per clip. Keep this tab open.
          </p>
        )}
      </div>
    </div>
  )
}

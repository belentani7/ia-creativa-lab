'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Crop,
  FlipHorizontal,
  FlipVertical,
  RotateCw,
  SlidersHorizontal,
  Sun,
  Contrast,
  Aperture,
  Focus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import {
  cloneCanvas,
  cropToAspect,
  cssFilterCanvas,
  flipCanvas,
  rotateCanvas,
  sharpenCanvas,
  vignetteCanvas,
} from '@/lib/firelab/imageops'

type Op = (src: HTMLCanvasElement) => HTMLCanvasElement

const GRADES: { id: string; label: string; filter: string }[] = [
  { id: 'grayscale', label: 'Grayscale', filter: 'grayscale(1)' },
  { id: 'warm', label: 'Warm', filter: 'sepia(0.34) saturate(1.18)' },
  { id: 'cool', label: 'Cool', filter: 'hue-rotate(12deg) saturate(1.04) brightness(1.02)' },
]

const CROP_ASPECTS: { label: string; value: number }[] = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
]

export function AdjustPanel() {
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const canUndo = useFireLab((s) => s.editor.canUndo)

  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [vignette, setVignette] = useState(0)
  const [sharpen, setSharpen] = useState(0)

  /** Snapshot of the image before the current slider drag (live preview base). */
  const baseRef = useRef<HTMLCanvasElement | null>(null)
  /** True while a slider interaction actually changed the value. */
  const dragDirtyRef = useRef(false)

  // restore the un-previewed base when the panel goes away mid-drag
  useEffect(() => {
    return () => {
      if (baseRef.current) {
        getEngine().setProcessedImage(cloneCanvas(baseRef.current))
        baseRef.current = null
      }
    }
  }, [])

  const ensureBase = (): HTMLCanvasElement => {
    if (!baseRef.current) baseRef.current = cloneCanvas(getEngine().getImageCanvas())
    return baseRef.current
  }

  /** Live (non-destructive, no undo entry) preview of a slider value. */
  const preview = (op: Op) => {
    const base = ensureBase()
    getEngine().setProcessedImage(op(cloneCanvas(base)))
  }

  /** Restore the pre-drag base silently (undo stack untouched). */
  const resetPreview = () => {
    if (baseRef.current) {
      getEngine().setProcessedImage(cloneCanvas(baseRef.current))
      baseRef.current = null
    }
  }

  /** Commit an op for real: pushes undo history + marks the project dirty. */
  const commit = (op: Op, opts?: { alsoMask?: boolean; refit?: boolean }) => {
    if (!imageLoaded) return
    getEngine().applyLocalOp(op, opts)
  }

  const discrete = (op: Op, label: string, opts?: { alsoMask?: boolean; refit?: boolean }) => {
    if (!imageLoaded) return
    commit(op, opts)
    toast.success(`${label} applied`, {
      description: 'Local pixel math — Ctrl+Z to undo, project marked dirty.',
    })
  }

  const sliderRow = (
    label: string,
    value: number,
    min: number,
    max: number,
    icon: React.ReactNode,
    onChange: (v: number) => void,
    makeOp: (v: number) => Op,
    format: (v: number) => string,
    ariaLabel: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="micro-label flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => {
          dragDirtyRef.current = true
          onChange(v[0])
          preview(makeOp(v[0]))
        }}
        onValueCommit={(v) => {
          if (!dragDirtyRef.current) return
          dragDirtyRef.current = false
          resetPreview()
          commit(makeOp(v[0]))
        }}
        disabled={!imageLoaded}
        aria-label={ariaLabel}
      />
    </div>
  )

  return (
    <div className="space-y-5">
      {!imageLoaded && (
        <div className="rounded-md border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          Load or generate an image first.
        </div>
      )}

      <p className="rounded-md border bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="text-foreground/90">Local canvas utilities — no provider, always available, instant.</span>{' '}
        Pure pixel math in your browser: every op is undo-able (Ctrl+Z) and marks the project dirty.
      </p>

      <section className="space-y-2" aria-label="Transform">
        <span className="micro-label">Transform</span>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-11 flex-col gap-0.5 text-[10px]"
            disabled={!imageLoaded}
            onClick={() => discrete((src) => flipCanvas(src, 'h'), 'Flip H', { alsoMask: true })}
            aria-label="Flip horizontally"
          >
            <FlipHorizontal className="h-4 w-4 text-ember" /> Flip H
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-11 flex-col gap-0.5 text-[10px]"
            disabled={!imageLoaded}
            onClick={() => discrete((src) => flipCanvas(src, 'v'), 'Flip V', { alsoMask: true })}
            aria-label="Flip vertically"
          >
            <FlipVertical className="h-4 w-4 text-ember" /> Flip V
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-11 flex-col gap-0.5 text-[10px]"
            disabled={!imageLoaded}
            onClick={() => discrete((src) => rotateCanvas(src, 1), 'Rotate 90°', { alsoMask: true, refit: true })}
            aria-label="Rotate 90 degrees clockwise"
          >
            <RotateCw className="h-4 w-4 text-ember" /> Rotate 90°
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Flips and rotations re-dimension the canvas and carry the painted mask along — mask stays aligned.
        </p>
      </section>

      <section className="space-y-2" aria-label="Crop">
        <span className="micro-label">Crop</span>
        <div className="flex flex-wrap gap-1.5">
          {CROP_ASPECTS.map((a) => (
            <Button
              key={a.label}
              variant="outline"
              size="sm"
              className="h-11 gap-1.5 text-[11px]"
              disabled={!imageLoaded}
              onClick={() => {
                if (!imageLoaded) return
                const size = getEngine().imageSize()
                if (Math.abs(size.width / size.height - a.value) < 0.01) {
                  toast.info(`Already ${a.label}`, {
                    description: 'The canvas matches this aspect — nothing to trim.',
                  })
                  return
                }
                discrete((src) => cropToAspect(src, a.value), `Crop ${a.label}`, { alsoMask: true, refit: true })
              }}
              aria-label={`Center-crop to ${a.label} aspect`}
            >
              <Crop className="h-3.5 w-3.5 text-ember" /> {a.label}
            </Button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Center-crop to a target aspect — the painted mask is cropped by the same rectangle, so it stays
          aligned.
        </p>
      </section>

      <section className="space-y-2" aria-label="Grades">
        <span className="micro-label">Grades</span>
        <div className="grid grid-cols-3 gap-1.5">
          {GRADES.map((g) => (
            <Button
              key={g.id}
              variant="outline"
              size="sm"
              className="h-11 flex-col gap-0.5 text-[10px]"
              disabled={!imageLoaded}
              onClick={() => discrete((src) => cssFilterCanvas(src, g.filter), g.label)}
              aria-label={`Apply ${g.label} grade`}
            >
              <SlidersHorizontal className="h-4 w-4 text-ember" /> {g.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-md border bg-secondary/30 p-3" aria-label="Tone">
        <span className="micro-label">Tone</span>
        {sliderRow(
          'Brightness',
          brightness,
          -50,
          50,
          <Sun className="h-3 w-3" aria-hidden="true" />,
          setBrightness,
          (v) => (src) => cssFilterCanvas(src, `brightness(${(1 + v / 100).toFixed(2)})`),
          (v) => (v > 0 ? `+${v}` : String(v)),
          'Brightness from minus 50 to plus 50'
        )}
        {sliderRow(
          'Contrast',
          contrast,
          -50,
          50,
          <Contrast className="h-3 w-3" aria-hidden="true" />,
          setContrast,
          (v) => (src) => cssFilterCanvas(src, `contrast(${(1 + v / 100).toFixed(2)})`),
          (v) => (v > 0 ? `+${v}` : String(v)),
          'Contrast from minus 50 to plus 50'
        )}
      </section>

      <section className="space-y-4 rounded-md border bg-secondary/30 p-3" aria-label="Effects">
        <span className="micro-label">Effects</span>
        {sliderRow(
          'Vignette',
          vignette,
          0,
          100,
          <Aperture className="h-3 w-3" aria-hidden="true" />,
          setVignette,
          (v) => (src) => vignetteCanvas(src, v),
          (v) => (v === 0 ? 'off' : `${v}`),
          'Vignette strength from 0 to 100'
        )}
        {sliderRow(
          'Sharpen',
          sharpen,
          0,
          100,
          <Focus className="h-3 w-3" aria-hidden="true" />,
          setSharpen,
          (v) => (src) => sharpenCanvas(src, v),
          (v) => (v === 0 ? 'off' : `${v}`),
          'Sharpen strength from 0 to 100'
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Sliders preview live on the canvas and commit on release — each release is one undo step.
        </p>
      </section>

      <p className="text-[11px] text-muted-foreground" aria-live="polite">
        {imageLoaded
          ? canUndo
            ? 'History: every adjust op joins the shared undo stack.'
            : 'History: the stack starts empty for this image.'
          : 'Waiting for an image.'}
      </p>
    </div>
  )
}

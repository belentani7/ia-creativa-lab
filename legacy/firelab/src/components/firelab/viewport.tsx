'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Brush,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  ImagePlus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { loadImageElement } from '@/lib/firelab/imageops'

const EXAMPLE_PROMPTS = [
  'a powerful black stallion, dark mist, dramatic rim light',
  'editorial still life, ember light on raw stone',
  'brutalist architecture, overcast, 35mm film',
]

/** Normalize imported images: downscale very large files to ≤2560px. */
async function normalizeImport(dataUrl: string): Promise<string> {
  const img = await loadImageElement(dataUrl)
  const max = Math.max(img.naturalWidth, img.naturalHeight)
  if (max <= 2560) return dataUrl
  const scale = 2560 / max
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * scale)
  canvas.height = Math.round(img.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

export function Viewport() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maskPreviewRef = useRef<HTMLCanvasElement>(null)

  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const hasMask = useFireLab((s) => s.editor.hasMask)
  const zoom = useFireLab((s) => s.editor.zoom)
  const canUndo = useFireLab((s) => s.editor.canUndo)
  const canRedo = useFireLab((s) => s.editor.canRedo)
  const maskActive = useFireLab((s) => s.maskActive)
  const brush = useFireLab((s) => s.brush)
  const comparing = useFireLab((s) => s.comparing)
  const setBrush = useFireLab((s) => s.setBrush)
  const setMaskActive = useFireLab((s) => s.setMaskActive)
  const set = useFireLab((s) => s.set)
  const setTool = useFireLab((s) => s.setTool)

  const [dragOver, setDragOver] = useState(false)

  // attach engine
  useEffect(() => {
    const engine = getEngine()
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    engine.attach(canvas, container)
    engine.onCursor = (pos) => {
      const el = cursorRef.current
      if (!el) return
      if (!pos || !engine.maskActive) {
        el.style.opacity = '0'
        return
      }
      const rect = container.getBoundingClientRect()
      el.style.opacity = '1'
      el.style.transform = `translate(${pos.x - rect.left}px, ${pos.y - rect.top}px) translate(-50%, -50%)`
    }
    return () => {
      engine.onCursor = null
      engine.detach()
    }
  }, [])

  // brush cursor size follows brush × zoom
  useEffect(() => {
    const el = cursorRef.current
    if (!el) return
    const size = Math.max(6, brush.size * zoom)
    el.style.width = `${size}px`
    el.style.height = `${size}px`
    el.style.borderColor = brush.erase ? 'rgba(255,255,255,0.9)' : 'rgba(255,90,31,0.95)'
  }, [brush.size, brush.erase, zoom])

  // mask preview refresh (poll signals — cheap)
  useEffect(() => {
    const engine = getEngine()
    const timer = window.setInterval(() => {
      if (maskPreviewRef.current && engine.hasImage()) {
        engine.drawMaskPreview(maskPreviewRef.current)
      }
    }, 400)
    return () => window.clearInterval(timer)
  }, [])

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        toast.error('Not an image', { description: 'Import PNG, JPG, WEBP or SVG files.' })
        return
      }
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Read failed'))
          reader.readAsDataURL(file)
        })
        const normalized = await normalizeImport(dataUrl)
        const engine = getEngine()
        await engine.loadImageFromDataUrl(normalized)
        toast.success('Image imported', {
          description: `${engine.imageSize().width} × ${engine.imageSize().height} px`,
        })
      } catch (err) {
        toast.error('Import failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    },
    []
  )

  // paste support
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            void handleFiles({ 0: file, length: 1, item: () => file } as unknown as FileList)
          }
          break
        }
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [handleFiles])

  const engine = getEngine()
  const showCursor = maskActive && imageLoaded

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${
        maskActive && imageLoaded ? 'cursor-none' : 'cursor-grab'
      } ${dragOver ? 'ring-1 ring-ember' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        void handleFiles(e.dataTransfer.files)
      }}
      role="application"
      aria-label="Image canvas viewport"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />

      {/* brush cursor */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 rounded-full border opacity-0 transition-opacity ${
          showCursor ? '' : '!opacity-0'
        }`}
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.5) inset' }}
      />

      {/* empty state */}
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            <p className="micro-label mb-2">BELENTANI</p>
            <h1 className="font-display text-5xl italic leading-none text-foreground">
              Fire<span className="text-ember">Lab</span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Local-first generative studio — the built-in engine works without any API key.
            </p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="focus-ember mt-8 flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card/40 text-muted-foreground transition hover:border-ember/60 hover:text-foreground"
              aria-label="Import image: drop, paste or click to browse"
            >
              <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
              <span className="text-sm">Drop an image, paste, or click to browse</span>
              <span className="text-xs text-muted-foreground/60">PNG · JPG · WEBP · SVG</span>
            </button>

            <div className="mt-6">
              <p className="micro-label mb-3">Or start from a prompt</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="focus-ember rounded-full border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-ember/50 hover:text-foreground"
                    onClick={() => {
                      set('prompt', p)
                      setTool('generate')
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* mask toolbar */}
      {imageLoaded && maskActive && (
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-lg border bg-background/90 px-3 py-2 shadow-lg backdrop-blur">
          <span className="micro-label hidden sm:inline">Mask</span>
          <div className="flex items-center gap-2">
            <Brush className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <Slider
              value={[brush.size]}
              min={4}
              max={400}
              step={2}
              onValueChange={(v) => setBrush({ size: v[0] })}
              className="w-24 sm:w-28"
              aria-label="Brush size"
            />
            <span className="w-8 text-right font-mono text-xs text-muted-foreground">{brush.size}</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Slider
              value={[brush.hardness]}
              min={0}
              max={100}
              step={5}
              onValueChange={(v) => setBrush({ hardness: v[0] })}
              className="w-20"
              aria-label="Brush hardness"
            />
            <span className="w-9 text-right font-mono text-xs text-muted-foreground">
              {brush.hardness}%
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setBrush({ erase: !brush.erase })}
              aria-pressed={brush.erase}
              title={brush.erase ? 'Eraser (E)' : 'Brush (B / E to erase)'}
            >
              {brush.erase ? <Eraser className="h-4 w-4 text-ember" /> : <Brush className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => engine.invertMask()} title="Invert mask (I)">
              Invert
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => engine.fillMask()} title="Select all">
              All
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => engine.clearMask()} title="Clear mask">
              Clear
            </Button>
          </div>
          <canvas
            ref={maskPreviewRef}
            width={44}
            height={44}
            className="hidden h-11 w-11 rounded border sm:block"
            aria-label="Mask preview (white = selected)"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMaskActive(false)}
            title="Finish masking (M)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* mask hint */}
      {imageLoaded && !maskActive && hasMask && (
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          mask present — press <kbd className="font-mono text-foreground/70">M</kbd> to edit
        </div>
      )}

      {/* compare badge */}
      {comparing && imageLoaded && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full bg-ember px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
          ORIGINAL
        </div>
      )}

      {/* viewport toolbar */}
      {imageLoaded && (
        <TooltipProvider delayDuration={250}>
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-0.5 rounded-lg border bg-background/90 p-1 shadow-lg backdrop-blur">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void engine.undo()} disabled={!canUndo} aria-label="Undo (Ctrl+Z)">
                  <Undo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Undo · Ctrl+Z</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void engine.redo()} disabled={!canRedo} aria-label="Redo (Ctrl+Shift+Z)">
                  <Redo2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Redo · Ctrl+Shift+Z</TooltipContent>
            </Tooltip>

            <div className="mx-1 h-5 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Hold to compare original (C)"
                  onPointerDown={() => {
                    engine.compare = true
                    engine.requestRender()
                    set('comparing', true)
                  }}
                  onPointerUp={() => {
                    engine.compare = false
                    engine.requestRender()
                    set('comparing', false)
                  }}
                  onPointerLeave={() => {
                    engine.compare = false
                    engine.requestRender()
                    set('comparing', false)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Hold: before / after (C)</TooltipContent>
            </Tooltip>

            <div className="mx-1 h-5 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => engine.setZoom(engine.getZoom() / 1.25)} aria-label="Zoom out (-)">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Zoom out</TooltipContent>
            </Tooltip>
            <span className="w-12 text-center font-mono text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => engine.setZoom(engine.getZoom() * 1.25)} aria-label="Zoom in (+)">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Zoom in</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => engine.fitView()} aria-label="Fit to view (0)">
                  <Maximize className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Fit · key 0</TooltipContent>
            </Tooltip>

            <div className="mx-1 h-5 w-px bg-border" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRef.current?.click()} aria-label="Import another image">
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Import image</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

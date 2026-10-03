'use client'

import { useState } from 'react'
import {
  AudioLines,
  Brush,
  Clapperboard,
  Download,
  Eraser,
  Expand,
  Focus,
  Maximize2,
  Mic,
  Music,
  Scaling,
  Search,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Video,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AssetRef } from '@/lib/firelab/types'

// ————— kinds —————

export const KIND_LABELS: Record<string, string> = {
  'text-to-image': 'GENERATE',
  fill: 'FILL',
  remove: 'REMOVE',
  expand: 'EXPAND',
  background: 'BACKGROUND',
  variations: 'VARIATION',
  refine: 'REFINE',
  enhance: 'ENHANCE',
  'text-to-video': 'VIDEO',
  'image-to-video': 'IMG→VIDEO',
  music: 'MUSIC',
  speech: 'SPEECH',
  transcription: 'TRANSCRIBE',
  'image-search': 'SEARCH',
  local: 'ADJUST',
}

export const KIND_ICONS: Record<string, LucideIcon> = {
  'text-to-image': Sparkles,
  fill: Brush,
  remove: Eraser,
  expand: Expand,
  background: Wand2,
  variations: Shuffle,
  refine: Scaling,
  enhance: Wand2,
  'text-to-video': Clapperboard,
  'image-to-video': Video,
  music: Music,
  speech: AudioLines,
  transcription: Mic,
  'image-search': Search,
  local: SlidersHorizontal,
}

// ————— mime helpers —————

export function isVideoAsset(mime: string): boolean {
  return mime.startsWith('video/')
}

export function isAudioAsset(mime: string): boolean {
  return mime.startsWith('audio/')
}

/** Anything that renders as a media player card (video or audio). */
export function isMediaAsset(mime: string): boolean {
  return isVideoAsset(mime) || isAudioAsset(mime)
}

const EXT_BY_MIME: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'image/gif': 'gif',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/ogg': 'ogg',
}

function extFor(mime: string): string {
  return EXT_BY_MIME[mime] ?? mime.split('/')[1]?.replace(/[^a-z0-9]/gi, '') ?? 'bin'
}

export function downloadName(kind: string, asset: AssetRef): string {
  return `firelab-${kind}-${asset.id.slice(0, 8)}.${extFor(asset.mime)}`
}

export function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return ''
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `0:${String(s).padStart(2, '0')}`
}

// ————— decorative waveform —————

function fnv1a(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0
  return h
}

function lcgBars(seed: number, count: number): number[] {
  const out: number[] = []
  let h = seed
  for (let i = 0; i < count; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    out.push(18 + (h % 82))
  }
  return out
}

function WaveformBars({ seed, className }: { seed: string; className?: string }) {
  const bars = 28
  const heights = lcgBars(fnv1a(seed), bars)
  return (
    <svg
      viewBox={`0 0 ${bars * 5} 100`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {heights.map((ht, i) => (
        <rect
          key={i}
          x={i * 5}
          y={100 - ht}
          width={3.2}
          height={ht}
          rx={1.4}
          fill="currentColor"
          opacity={0.3 + (ht / 100) * 0.55}
        />
      ))}
    </svg>
  )
}

// ————— result dialog —————

export interface MediaMeta {
  kind: string
  kindLabel?: string
  provider?: string
  prompt?: string | null
  durationMs?: number | null
  createdAt?: string
  demo?: boolean
}

export function MediaResultDialog({
  asset,
  meta,
  open,
  onOpenChange,
}: {
  asset: AssetRef
  meta: MediaMeta
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const kindLabel = meta.kindLabel ?? KIND_LABELS[meta.kind] ?? meta.kind
  const Icon = KIND_ICONS[meta.kind] ?? (isAudioAsset(asset.mime) ? Music : Clapperboard)
  const isAudio = isAudioAsset(asset.mime)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-border bg-card/95 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg italic text-foreground">
            <Icon className="h-4 w-4 text-ember" aria-hidden="true" />
            {kindLabel} result
          </DialogTitle>
          <DialogDescription className="sr-only">
            Media result details with player and metadata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {isAudio ? (
            <div className="space-y-3 rounded-lg border bg-secondary/30 p-4">
              <WaveformBars seed={asset.id} className="h-14 w-full text-ember" />
              <audio controls src={asset.url} className="h-10 w-full" preload="metadata" />
            </div>
          ) : (
            <video
              controls
              src={asset.url}
              preload="metadata"
              className="max-h-[62vh] w-full rounded-lg border bg-black"
              aria-label={`${kindLabel} player`}
            />
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-4">
            <div>
              <dt className="micro-label">Kind</dt>
              <dd className="mt-0.5 text-foreground/90">{kindLabel}</dd>
            </div>
            <div>
              <dt className="micro-label">Provider</dt>
              <dd className="mt-0.5 truncate text-foreground/90">{meta.provider ?? '—'}</dd>
            </div>
            <div>
              <dt className="micro-label">Engine time</dt>
              <dd className="mt-0.5 text-foreground/90">
                {meta.durationMs ? `${(meta.durationMs / 1000).toFixed(1)} s` : '—'}
              </dd>
            </div>
            <div>
              <dt className="micro-label">Format</dt>
              <dd className="mt-0.5 truncate font-mono text-foreground/90">
                {asset.mime}
                {asset.width > 0 && asset.height > 0 ? ` · ${asset.width}×${asset.height}` : ''}
              </dd>
            </div>
          </dl>

          {meta.demo && (
            <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium tracking-wide text-amber-500">
              DEMO RESULT — deterministic placeholder, not AI output.
            </p>
          )}
          {meta.prompt && (
            <div className="space-y-1">
              <span className="micro-label">Prompt</span>
              <p className="max-h-24 overflow-y-auto scroll-thin text-xs leading-relaxed text-foreground/80">
                {meta.prompt}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
            <a href={asset.url} download={downloadName(meta.kind, asset)} aria-label="Download media file">
              <Download className="h-3.5 w-3.5 text-ember" /> Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ————— cards —————

function MetaRow({
  asset,
  meta,
  duration,
  onExpand,
}: {
  asset: AssetRef
  meta: MediaMeta
  duration: number | null
  onExpand: () => void
}) {
  const kindLabel = meta.kindLabel ?? KIND_LABELS[meta.kind] ?? meta.kind
  const Icon = KIND_ICONS[meta.kind] ?? (isAudioAsset(asset.mime) ? Music : Clapperboard)
  const clock = formatClock(duration)
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-ember" aria-hidden="true" />
      <span className="micro-label !text-[9px]">{kindLabel}</span>
      {clock && <span className="font-mono text-[10px] text-muted-foreground">{clock}</span>}
      {meta.demo && <span className="text-[10px] font-medium tracking-wide text-amber-500">DEMO</span>}
      <span className="ml-auto flex items-center gap-1">
        <a
          href={asset.url}
          download={downloadName(meta.kind, asset)}
          className="focus-ember flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label={`Download ${kindLabel} file`}
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
        <button
          type="button"
          onClick={onExpand}
          className="focus-ember flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label={`Open ${kindLabel} details`}
          title="Open details"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
  )
}

/** Compact card for the history strip (fixed width, strip height). */
export function MediaResultCard({ asset, meta }: { asset: AssetRef; meta: MediaMeta }) {
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const isAudio = isAudioAsset(asset.mime)

  return (
    <div className="flex h-full w-56 shrink-0 flex-col gap-1.5 overflow-hidden rounded-md border bg-card/60 p-2">
      {isAudio ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ember h-9 shrink-0 rounded-md border bg-secondary/30 px-2 text-ember"
            aria-label="Open audio details"
          >
            <WaveformBars seed={asset.id} className="h-full w-full" />
          </button>
          <audio controls src={asset.url} className="h-8 w-full shrink-0" preload="metadata" />
        </>
      ) : (
        <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md border bg-black">
          <video
            controls
            preload="metadata"
            src={asset.url}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            className="absolute inset-0 h-full w-full object-contain"
            aria-label={`${KIND_LABELS[meta.kind] ?? 'media'} player`}
          />
        </div>
      )}
      <MetaRow asset={asset} meta={meta} duration={isAudio ? null : duration} onExpand={() => setOpen(true)} />
      <MediaResultDialog asset={asset} meta={meta} open={open} onOpenChange={setOpen} />
    </div>
  )
}

/** Full card for the gallery grid. */
export function MediaGalleryCard({ asset, meta }: { asset: AssetRef; meta: MediaMeta }) {
  const [open, setOpen] = useState(false)
  const [duration, setDuration] = useState<number | null>(null)
  const isAudio = isAudioAsset(asset.mime)
  const kindLabel = meta.kindLabel ?? KIND_LABELS[meta.kind] ?? meta.kind
  const Icon = KIND_ICONS[meta.kind] ?? (isAudio ? Music : Clapperboard)

  return (
    <figure className="group overflow-hidden rounded-lg border bg-card/50">
      {isAudio ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ember block w-full border-b bg-secondary/30 px-3 py-4 text-ember"
          aria-label={`Open ${kindLabel} details`}
        >
          <WaveformBars seed={asset.id} className="h-16 w-full" />
        </button>
      ) : (
        <div className="aspect-video w-full bg-black">
          <video
            controls
            preload="metadata"
            src={asset.url}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            className="h-full w-full object-contain"
            aria-label={`${kindLabel} player`}
          />
        </div>
      )}
      <figcaption className="space-y-1 p-2.5">
        {isAudio ? (
          <audio controls src={asset.url} className="h-8 w-full" preload="metadata" />
        ) : (
          <p className="line-clamp-2 text-[11px] leading-snug text-foreground/80">
            {meta.prompt ?? kindLabel}
            {duration ? (
              <span className="ml-1 font-mono text-muted-foreground">· {formatClock(duration)}</span>
            ) : null}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Icon className="h-3 w-3 text-ember" aria-hidden="true" />
            {kindLabel}
          </span>
          <span className="max-w-24 truncate">{meta.provider ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
          <span>{meta.createdAt ? new Date(meta.createdAt).toLocaleString() : ''}</span>
          <span className="flex items-center gap-1">
            {meta.demo && <span className="font-semibold tracking-widest text-amber-400">DEMO</span>}
            <button
              type="button"
              className="focus-ember rounded p-1 hover:text-foreground"
              onClick={() => setOpen(true)}
              aria-label={`Open ${kindLabel} details`}
            >
              <Focus className="h-3.5 w-3.5" />
            </button>
            <a
              href={asset.url}
              download={downloadName(meta.kind, asset)}
              className="focus-ember rounded p-1 hover:text-foreground"
              aria-label="Download media file"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          </span>
        </div>
      </figcaption>
      <MediaResultDialog asset={asset} meta={meta} open={open} onOpenChange={setOpen} />
    </figure>
  )
}

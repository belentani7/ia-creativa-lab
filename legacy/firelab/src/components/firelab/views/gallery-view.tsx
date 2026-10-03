'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Download, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { assetToDataUrl, fetchHistory } from '@/lib/firelab/api-client'
import { downloadBlob } from '@/lib/firelab/imageops'
import { isMediaAsset, downloadName, MediaGalleryCard } from '../media-result'
import type { GenerationRecord } from '@/lib/firelab/types'

const KIND_OPTIONS = [
  'all',
  'text-to-image',
  'fill',
  'remove',
  'expand',
  'background',
  'variations',
  'refine',
  'enhance',
  'text-to-video',
  'image-to-video',
  'music',
  'speech',
  'transcription',
  'image-search',
] as const

const KIND_LABELS: Record<string, string> = {
  all: 'All kinds',
  'text-to-image': 'Generate',
  fill: 'Fill',
  remove: 'Remove',
  expand: 'Expand',
  background: 'Background',
  variations: 'Variations',
  refine: 'Refine',
  enhance: 'Enhance',
  'text-to-video': 'Video',
  'image-to-video': 'Img → Video',
  music: 'Music',
  speech: 'Speech',
  transcription: 'Transcribe',
  'image-search': 'Search',
}

export function GalleryView() {
  const [kind, setKind] = useState<string>('all')
  const [provider, setProvider] = useState<string>('all')
  const history = useFireLab((s) => s.history)
  const loading = useFireLab((s) => s.historyLoading)
  const refreshHistory = useFireLab((s) => s.refreshHistory)
  const providers = useFireLab((s) => s.providers)

  const load = useCallback(async () => {
    await refreshHistory({ limit: 200 })
  }, [refreshHistory])

  const [spin, setSpin] = useState(false)
  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(
    () =>
      history.filter(
        (r) => (kind === 'all' || r.kind === kind) && (provider === 'all' || r.provider === provider)
      ),
    [history, kind, provider]
  )

  const providerOptions = useMemo(() => {
    const ids = new Set(history.map((r) => r.provider))
    return ['all', ...Array.from(ids)]
  }, [history])

  const onApply = async (record: GenerationRecord) => {
    const asset = record.assets?.[0]
    if (!asset) return
    try {
      const dataUrl = await assetToDataUrl(asset.url)
      const engine = getEngine()
      await engine.loadImageFromDataUrl(dataUrl)
      useFireLab.getState().setView('studio')
      toast.success('Opened on canvas')
    } catch (err) {
      toast.error('Failed to open', { description: err instanceof Error ? err.message : '' })
    }
  }

  const onDownload = async (record: GenerationRecord) => {
    const asset = record.assets?.[0]
    if (!asset) return
    try {
      const res = await fetch(asset.url)
      const blob = await res.blob()
      const name = isMediaAsset(asset.mime)
        ? downloadName(record.kind, asset)
        : `firelab-${record.kind}-${record.id.slice(0, 8)}.png`
      downloadBlob(blob, name)
    } catch {
      toast.error('Download failed')
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="micro-label">Archive</p>
          <h1 className="font-display mt-1 text-3xl italic text-foreground">
            Gal<span className="text-ember">lery</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every generation is recorded locally — prompt, provider, timing and results. Click any
            image to open it on the canvas; video and audio play inline.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setSpin(true)
            void load().finally(() => setSpin(false))
          }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="h-9 w-36 border-border text-xs" aria-label="Filter by kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIND_OPTIONS.map((k) => (
              <SelectItem key={k} value={k}>{KIND_LABELS[k] ?? k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="h-9 w-40 border-border text-xs" aria-label="Filter by provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {providerOptions.map((p) => (
              <SelectItem key={p} value={p}>
                {p === 'all'
                  ? 'All providers'
                  : providers.find((pr) => pr.id === p)?.name.split(' (')[0] ?? p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-auto self-center text-xs text-muted-foreground">{filtered.length} results</span>
      </div>

      {loading && (
        <p className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading gallery…
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((record) => {
          const asset = record.assets?.[0]
          if (!asset) return null
          if (isMediaAsset(asset.mime)) {
            return (
              <MediaGalleryCard
                key={record.id}
                asset={asset}
                meta={{
                  kind: record.kind,
                  kindLabel: KIND_LABELS[record.kind] ?? record.kind,
                  provider: record.provider,
                  prompt: record.prompt,
                  demo: record.provider === 'demo',
                  durationMs: record.durationMs ?? undefined,
                  createdAt: record.createdAt,
                }}
              />
            )
          }
          return (
            <figure key={record.id} className="group overflow-hidden rounded-lg border bg-card/50">
              <button
                type="button"
                className="focus-ember relative block aspect-square w-full overflow-hidden"
                onClick={() => void onApply(record)}
                title={record.prompt ?? record.kind}
                aria-label={`Open ${record.kind} result`}
              >
                <img
                  src={asset.thumbUrl ?? asset.url}
                  alt={record.prompt ?? `${record.kind} result`}
                  className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {record.provider === 'demo' && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-semibold tracking-widest text-amber-400">
                    DEMO
                  </span>
                )}
              </button>
              <figcaption className="space-y-1 p-2.5">
                <p className="line-clamp-2 text-[11px] leading-snug text-foreground/80">
                  {record.prompt ?? record.kind}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="uppercase tracking-wider">{KIND_LABELS[record.kind] ?? record.kind}</span>
                  <span>{record.provider}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/70">
                  <span>{new Date(record.createdAt).toLocaleString()}</span>
                  <button
                    type="button"
                    className="focus-ember rounded p-1 hover:text-foreground"
                    onClick={() => void onDownload(record)}
                    aria-label="Download image"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              </figcaption>
            </figure>
          )
        })}
      </div>

      {!loading && filtered.length === 0 && (
        <p className="mt-10 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing here yet — generate something in the studio.
        </p>
      )}
    </div>
  )
}

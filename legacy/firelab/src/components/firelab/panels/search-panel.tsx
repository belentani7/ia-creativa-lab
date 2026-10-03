'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Download, ExternalLink, ImageOff, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob } from '@/lib/firelab/jobs'
import { imageSearch, downloadSearchImage, assetToDataUrl } from '@/lib/firelab/api-client'
import type { ImageSearchResult } from '@/lib/firelab/providers/types'

const RESULT_CAP = 12

function ResultCard({
  result,
  busy,
  onAdd,
}: {
  result: ImageSearchResult
  busy: boolean
  onAdd: (result: ImageSearchResult) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const host = (() => {
    try {
      return new URL(result.url).hostname.replace(/^www\./, '')
    } catch {
      return result.source || 'web'
    }
  })()

  return (
    <figure className="overflow-hidden rounded-lg border bg-card/60">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary/40">
        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <ImageOff className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">preview unavailable</span>
          </div>
        ) : (
          <>
            {!loaded && <div className="absolute inset-0 animate-pulse bg-secondary" aria-hidden="true" />}
            <img
              src={result.url}
              alt={result.caption || 'search result'}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <Loader2 className="h-5 w-5 animate-spin text-ember" aria-hidden="true" />
          </span>
        )}
      </div>
      <figcaption className="space-y-1.5 p-2">
        <p className="line-clamp-2 text-[11px] leading-snug text-foreground/80">
          {result.caption || 'No caption'}
        </p>
        <span className="inline-block max-w-full truncate rounded border bg-secondary/40 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground" title={result.source || host}>
          {result.source || host}
        </span>
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 text-[11px]"
            onClick={() => onAdd(result)}
            disabled={busy}
            aria-label={`Add ${result.caption || 'result'} to canvas`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-ember" />}
            Canvas
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1 text-[11px]"
            onClick={() => window.open(result.url, '_blank', 'noopener,noreferrer')}
            aria-label={`Open ${result.caption || 'result'} in a new tab`}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </Button>
        </div>
      </figcaption>
    </figure>
  )
}

export function SearchPanel() {
  const setView = useFireLab((s) => s.setView)
  const query = useFireLab((s) => s.searchQuery)
  const setSearchQuery = useFireLab((s) => s.set)
  const { runJob } = useRunJob()

  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<ImageSearchResult[] | null>(null)
  const [busyUrl, setBusyUrl] = useState<string | null>(null)

  const onSearch = async () => {
    if (searching || !query.trim()) return
    setSearching(true)
    setResults(null)
    try {
      await runJob({
        id: crypto.randomUUID(),
        kind: 'image-search',
        label: `Search · ${query.trim().slice(0, 44)}`,
        fn: async (signal) => {
          const res = await imageSearch(query.trim(), RESULT_CAP, signal)
          return {
            results: [],
            providerId: res.providerId,
            demo: false,
            events: [],
            durationMs: res.durationMs,
            extra: { found: res.results.length, hits: res.results },
          }
        },
        onDone: (res) => {
          const hits = Array.isArray(res.extra?.hits) ? (res.extra.hits as ImageSearchResult[]) : []
          setResults(hits)
          toast.success(`${hits.length} reference${hits.length === 1 ? '' : 's'} found`, {
            description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s — click “Canvas” to download one onto the editor.`,
          })
        },
      })
    } catch (err) {
      toast.error('Image search failed', {
        description: err instanceof Error ? err.message : 'The search engine could not be reached.',
      })
    } finally {
      setSearching(false)
    }
  }

  const onAdd = async (result: ImageSearchResult) => {
    if (busyUrl) return
    setBusyUrl(result.url)
    const engine = getEngine()
    try {
      await runJob({
        id: crypto.randomUUID(),
        kind: 'image-search',
        label: `Reference · ${(result.caption || result.url).slice(0, 36)}`,
        fn: async (signal) => {
          const res = await downloadSearchImage(result.url, signal)
          return {
            results: [res.asset],
            providerId: 'image-search-download',
            demo: false,
            events: [],
            durationMs: res.durationMs,
          }
        },
        onDone: async (res) => {
          const asset = res.results[0]
          if (!asset) return
          const dataUrl = await assetToDataUrl(asset.url)
          await engine.loadImageFromDataUrl(dataUrl)
          setView('studio')
          toast.success('Reference on canvas', {
            description: `${asset.width} × ${asset.height} px — downloaded through the server and saved to assets.`,
          })
        },
      })
    } catch (err) {
      toast.error('Could not add to canvas', {
        description: err instanceof Error ? err.message : 'The download was refused.',
      })
    } finally {
      setBusyUrl(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-2" aria-label="Search query">
        <Label htmlFor="fl-search-query" className="micro-label">Query</Label>
        <div className="flex gap-2">
          <Input
            id="fl-search-query"
            value={query}
            onChange={(e) => setSearchQuery('searchQuery', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onSearch()
            }}
            placeholder="black stallion studio portrait, rim light…"
            className="h-11 border-border bg-secondary/30 text-sm"
          />
          <Button
            onClick={() => void onSearch()}
            disabled={searching || !query.trim()}
            className="h-11 w-11 shrink-0 gap-2 bg-primary text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
            aria-label="Search the web for reference images"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Web image lookup through the built-in engine — up to {RESULT_CAP} captioned results.
          Downloads are fetched server-side, mime-checked and stored as assets.
        </p>
      </section>

      {searching && results === null && (
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-lg border bg-secondary/40" aria-hidden="true" />
          ))}
        </div>
      )}

      {results && results.length === 0 && !searching && (
        <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          No results for “{query.trim()}” — try different wording.
        </p>
      )}

      {results && results.length > 0 && (
        <section className="space-y-2" aria-label="Search results">
          <div className="flex items-center justify-between">
            <span className="micro-label">Results</span>
            <span className="text-[11px] text-muted-foreground">{results.length} / {RESULT_CAP}</span>
          </div>
          <div className="scroll-thin grid max-h-[26rem] grid-cols-2 gap-2.5 overflow-y-auto pr-1">
            {results.map((r) => (
              <ResultCard key={r.url} result={r} busy={busyUrl === r.url} onAdd={(res) => void onAdd(res)} />
            ))}
          </div>
        </section>
      )}

      {results === null && !searching && (
        <p className="rounded-md border bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          Reference hunting is a first-class step: search, preview, then send a result straight to
          the canvas for filling, background swaps or image-to-video start frames.
        </p>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, ChevronDown, Loader2, RefreshCw, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFireLab, type Job } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { cancelJob } from '@/lib/firelab/jobs'
import { assetToDataUrl } from '@/lib/firelab/api-client'
import { KIND_ICONS, KIND_LABELS, MediaResultCard, isMediaAsset } from './media-result'
import type { AssetRef, GenerationRecord } from '@/lib/firelab/types'

async function applyAsset(asset: AssetRef, kind: string) {
  try {
    const engine = getEngine()
    const dataUrl = await assetToDataUrl(asset.url)
    if (kind === 'text-to-image') {
      await engine.loadImageFromDataUrl(dataUrl)
    } else {
      await engine.loadImageFromDataUrl(dataUrl, { keepOriginal: true })
    }
    toast.success('Applied to canvas', { description: `source: ${asset.width} × ${asset.height} px` })
  } catch (err) {
    toast.error('Failed to apply', {
      description: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}

function JobCard({ job }: { job: Job }) {
  const KindIcon = KIND_ICONS[job.kind]
  return (
    <div className="flex h-full w-56 shrink-0 flex-col gap-1.5 rounded-md border bg-card/60 p-2.5">
      <div className="flex items-center gap-1.5">
        {job.status === 'running' && <Loader2 className="h-3.5 w-3.5 animate-spin text-ember" aria-hidden="true" />}
        {job.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />}
        {(job.status === 'failed' || job.status === 'cancelled') && (
          <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
        )}
        {KindIcon && <KindIcon className="h-3 w-3 text-ember" aria-hidden="true" />}
        <span className="micro-label !text-[9px]">{KIND_LABELS[job.kind] ?? job.kind}</span>
        {job.providerId && (
          <span className="ml-auto max-w-20 truncate text-[10px] text-muted-foreground">{job.providerId}</span>
        )}
      </div>
      <p className="line-clamp-2 text-[11px] leading-snug text-foreground/80">{job.label}</p>
      {job.status === 'running' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-full text-[10px] text-muted-foreground"
          onClick={() => cancelJob(job.id)}
        >
          <X className="mr-1 h-3 w-3" /> cancel
        </Button>
      )}
      {job.error && (
        <p className="line-clamp-3 text-[10px] leading-snug text-destructive/90" title={job.error}>
          {job.error}
        </p>
      )}
      {job.demo && job.status === 'completed' && (
        <p className="text-[10px] font-medium tracking-wide text-amber-500">DEMO RESULT</p>
      )}
    </div>
  )
}

function ResultThumb({
  asset,
  job,
}: {
  asset: AssetRef
  job: Job
}) {
  if (isMediaAsset(asset.mime)) {
    return (
      <MediaResultCard
        asset={asset}
        meta={{
          kind: job.kind,
          provider: job.providerId,
          prompt: job.prompt ?? job.label,
          demo: job.demo,
          durationMs: job.durationMs,
        }}
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => void applyAsset(asset, job.kind)}
      className="focus-ember group relative h-full shrink-0 overflow-hidden rounded-md border transition hover:border-ember/60"
      title={`Apply result · ${asset.width} × ${asset.height}`}
      aria-label={`Apply result to canvas`}
    >
      <img
        src={asset.thumbUrl ?? asset.url}
        alt="Result thumbnail"
        className="h-full w-auto max-w-36 object-cover"
        loading="lazy"
      />
      <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[9px] uppercase tracking-widest text-white/90 opacity-0 transition group-hover:opacity-100">
        apply
      </span>
    </button>
  )
}

function HistoryThumb({ record }: { record: GenerationRecord }) {
  const asset = record.assets?.[0]
  if (!asset) return null
  if (isMediaAsset(asset.mime)) {
    return (
      <MediaResultCard
        asset={asset}
        meta={{
          kind: record.kind,
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
    <button
      type="button"
      onClick={() => void applyAsset(asset, record.kind)}
      className="focus-ember group relative h-full shrink-0 overflow-hidden rounded-md border transition hover:border-ember/60"
      title={`${record.prompt ?? record.kind}\n${record.provider} · ${new Date(record.createdAt).toLocaleString()}`}
      aria-label={`Open ${record.kind} from history`}
    >
      <img
        src={asset.thumbUrl ?? asset.url}
        alt={`${record.kind} result`}
        className="h-full w-auto max-w-36 object-cover"
        loading="lazy"
      />
      <span className="absolute left-0 top-0 bg-black/70 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-white/80">
        {KIND_LABELS[record.kind] ?? record.kind}
      </span>
      {record.provider === 'demo' && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] font-semibold tracking-widest text-amber-400">
          DEMO
        </span>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[9px] uppercase tracking-widest text-white/90 opacity-0 transition group-hover:opacity-100">
        open
      </span>
    </button>
  )
}

export function HistoryStrip() {
  const jobs = useFireLab((s) => s.jobs)
  const history = useFireLab((s) => s.history)
  const historyLoading = useFireLab((s) => s.historyLoading)
  const bottomOpen = useFireLab((s) => s.bottomOpen)
  const refreshHistory = useFireLab((s) => s.refreshHistory)
  const set = useFireLab((s) => s.set)
  const [spin, setSpin] = useState(false)

  const activeJobs = jobs.filter((j) => j.status === 'running')
  const completedJobs = jobs.filter((j) => j.status === 'completed' && j.results?.length)

  return (
    <section
      aria-label="History and results"
      className={`flex shrink-0 flex-col border-t bg-card/30 transition-all ${
        bottomOpen ? 'h-44' : 'h-9'
      }`}
    >
      <div className="flex h-9 shrink-0 items-center gap-3 px-3">
        <button
          type="button"
          className="focus-ember flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground"
          onClick={() => set('bottomOpen', !bottomOpen)}
          aria-expanded={bottomOpen}
          aria-label={bottomOpen ? 'Collapse history' : 'Expand history'}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${bottomOpen ? '' : 'rotate-180'}`} />
          History · Results
        </button>
        {activeJobs.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-ember">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            {activeJobs.length} running
          </span>
        )}
        {jobs.some((j) => j.status === 'failed') && (
          <span className="text-[10px] text-destructive">
            {jobs.filter((j) => j.status === 'failed').length} failed
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setSpin(true)
              void refreshHistory().finally(() => setSpin(false))
            }}
            aria-label="Refresh history"
            title="Refresh history"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} />
          </Button>
        </span>
      </div>

      {bottomOpen && (
        <div className="scroll-thin flex flex-1 items-stretch gap-3 overflow-x-auto px-3 pb-2.5">
          {jobs.length === 0 && history.length === 0 && (
            <p className="m-auto text-xs text-muted-foreground">
              {historyLoading ? 'Loading history…' : 'Generations appear here — results, providers, timing and errors.'}
            </p>
          )}
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
          {completedJobs.map((job) => (
            <div key={`${job.id}-results`} className="flex h-full shrink-0 gap-1.5">
              {job.results!.map((asset) => (
                <ResultThumb key={asset.id} asset={asset} job={job} />
              ))}
            </div>
          ))}
          {history
            .filter((r) => r.status !== 'failed' && r.assets.length > 0)
            .map((record) => (
              <HistoryThumb key={record.id} record={record} />
            ))}
        </div>
      )}
    </section>
  )
}

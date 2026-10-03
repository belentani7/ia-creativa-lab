'use client'

// BELENTANI FIRELAB — job runner helper (client)
import { useFireLab, type Job } from './store'
import type { AssetRef, FallbackEvent } from './types'
import type { GenerateResponse } from './api-client'

/** Abort controllers for running jobs (cancel from the history strip). */
export const jobControllers = new Map<string, AbortController>()

export interface JobResult {
  results: AssetRef[]
  providerId: string
  demo: boolean
  events: FallbackEvent[]
  durationMs: number
  extra?: Record<string, unknown>
}

/** Normalize an API generation/edit response into a JobResult. */
export function toJobResult(r: GenerateResponse): JobResult {
  return {
    results: (r.assets ?? r.results ?? []) as AssetRef[],
    providerId: r.providerId,
    demo: r.demo ?? false,
    events: r.events ?? [],
    durationMs: r.durationMs ?? 0,
  }
}

export function useRunJob() {
  const addJob = useFireLab((s) => s.addJob)
  const patchJob = useFireLab((s) => s.patchJob)
  const refreshHistory = useFireLab((s) => s.refreshHistory)

  async function runJob(opts: {
    id: string
    kind: Job['kind']
    label: string
    prompt?: string
    fn: (signal: AbortSignal) => Promise<JobResult>
    onDone?: (result: JobResult) => void
  }): Promise<JobResult | null> {
    const controller = new AbortController()
    jobControllers.set(opts.id, controller)
    addJob({
      id: opts.id,
      kind: opts.kind,
      label: opts.label,
      prompt: opts.prompt,
      status: 'running',
      startedAt: Date.now(),
    })
    try {
      const result = await opts.fn(controller.signal)
      patchJob(opts.id, {
        status: 'completed',
        endedAt: Date.now(),
        providerId: result.providerId,
        results: result.results,
        demo: result.demo,
        durationMs: result.durationMs,
        events: result.events,
      })
      void refreshHistory()
      opts.onDone?.(result)
      return result
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      patchJob(opts.id, {
        status: aborted ? 'cancelled' : 'failed',
        endedAt: Date.now(),
        error: aborted ? 'Cancelled by user (server may finish and save the result).' : err instanceof Error ? err.message : String(err),
      })
      if (!aborted) throw err
      return null
    } finally {
      jobControllers.delete(opts.id)
    }
  }

  return { runJob }
}

export function cancelJob(id: string): void {
  jobControllers.get(id)?.abort()
}

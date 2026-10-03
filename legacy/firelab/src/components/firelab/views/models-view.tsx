'use client'

import { useEffect, useState } from 'react'
import { Boxes, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useFireLab } from '@/lib/firelab/store'
import type { ProviderInfo } from '@/lib/firelab/types'
import { CAPABILITY_LABELS } from '@/lib/firelab/types'

interface CatalogEntry {
  providerId: string
  providerName: string
  providerKind: string
  providerStatus: string
  id: string
  label: string
  capabilities: (keyof typeof CAPABILITY_LABELS)[]
  status: 'available' | 'not-configured' | 'unavailable'
  size?: string
  vram?: string
  license?: string
  source?: string
  note?: string
}

export function ModelsView() {
  const providers = useFireLab((s) => s.providers)
  const providersLoading = useFireLab((s) => s.providersLoading)
  const refreshProviders = useFireLab((s) => s.refreshProviders)
  const [catalog, setCatalog] = useState<CatalogEntry[]>([])

  useEffect(() => {
    void refreshProviders()
  }, [refreshProviders])

  useEffect(() => {
    const entries: CatalogEntry[] = providers.flatMap((p: ProviderInfo) =>
      p.models.map((m) => ({
        providerId: p.id,
        providerName: p.name,
        providerKind: p.kind,
        providerStatus: p.status,
        ...m,
      }))
    )
    setCatalog(entries)
  }, [providers])

  const groups = catalog.reduce<Record<string, CatalogEntry[]>>((acc, entry) => {
    ;(acc[entry.providerName] ??= []).push(entry)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <p className="micro-label">Runtime catalog</p>
      <h1 className="font-display mt-1 text-3xl italic text-foreground">
        Model <span className="text-ember">Manager</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Which models FireLab can reach right now. The built-in engine needs nothing; local runtimes
        (ComfyUI, Ollama) contribute the models installed on your machine; cloud models activate with a
        key. Nothing is downloaded without your action.
      </p>

      <div className="mt-4 rounded-md border bg-secondary/30 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <span className="text-foreground/90">Roadmap — browser-local models.</span> Direct WebGPU/ONNX
        in-browser diffusion (no server at all) is the next architecture milestone. The adapter slots
        already exist: <code className="rounded bg-secondary px-1 font-mono text-[10px]">src/lib/firelab/providers/</code>{' '}
        — a WebGPU runtime would register like any other provider. Documented in{' '}
        <code className="rounded bg-secondary px-1 font-mono text-[10px]">docs/architecture.md</code>.
      </div>

      {providersLoading && (
        <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
        </p>
      )}

      <div className="mt-8 space-y-8">
        {Object.entries(groups).map(([providerName, entries]) => (
          <section key={providerName} aria-label={providerName}>
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-foreground">{providerName}</h2>
              <Badge
                variant="outline"
                className={`text-[9px] tracking-widest ${
                  entries[0].providerStatus === 'available'
                    ? 'border-emerald-600/40 text-emerald-500'
                    : 'border-zinc-600/50 text-zinc-400'
                }`}
              >
                {entries[0].providerStatus === 'available' ? 'REACHABLE' : 'NOT REACHABLE'}
              </Badge>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {entries.map((m) => (
                <article key={`${m.providerId}-${m.id}`} className="rounded-lg border bg-card/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-mono text-xs text-foreground">{m.label}</h3>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[9px] ${
                        m.status === 'available'
                          ? 'border-emerald-600/40 text-emerald-500'
                          : 'border-zinc-600/50 text-zinc-400'
                      }`}
                    >
                      {m.status === 'available' ? 'READY' : m.status === 'not-configured' ? 'NEEDS KEY' : 'OFFLINE'}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {m.capabilities.map((c) => (
                      <span key={c} className="rounded-full border bg-secondary/40 px-1.5 py-0.5 text-[9px] text-muted-foreground">
                        {CAPABILITY_LABELS[c] ?? c}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                    {m.size && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted-foreground/60">size</dt>
                        <dd>{m.size}</dd>
                      </div>
                    )}
                    {m.vram && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted-foreground/60">vram</dt>
                        <dd>{m.vram}</dd>
                      </div>
                    )}
                    {m.license && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted-foreground/60">license</dt>
                        <dd>{m.license}</dd>
                      </div>
                    )}
                    {m.source && (
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-muted-foreground/60">source</dt>
                        <dd>{m.source}</dd>
                      </div>
                    )}
                  </dl>
                  {m.note && <p className="mt-2 text-[11px] leading-relaxed text-amber-500/80">{m.note}</p>}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

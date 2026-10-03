'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Loader2,
  Plug,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useFireLab } from '@/lib/firelab/store'
import { testProviderConnection } from '@/lib/firelab/api-client'
import type { Capability, ProviderInfo, ProviderKind, ProviderTestResult } from '@/lib/firelab/types'
import { CAPABILITY_LABELS } from '@/lib/firelab/types'

const KIND_BADGES: Record<string, { label: string; className: string }> = {
  builtin: { label: 'BUILT-IN', className: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-500' },
  local: { label: 'LOCAL', className: 'border-amber-600/40 bg-amber-500/10 text-amber-500' },
  cloud: { label: 'CLOUD', className: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-300' },
  demo: { label: 'DEMO', className: 'border-zinc-600/40 bg-zinc-700/20 text-zinc-400' },
}

const KIND_FILTERS: { id: ProviderKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'builtin', label: 'Builtin' },
  { id: 'local', label: 'Local' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'demo', label: 'Demo' },
]

const ORDERED_CAPS: Capability[] = [
  'textToImage',
  'imageToImage',
  'inpainting',
  'outpainting',
  'removeObject',
  'removeBackground',
  'variations',
  'upscale',
  'promptEnhance',
  'negativePrompt',
  'seed',
  'textToVideo',
  'imageToVideo',
  'textToMusic',
  'textToSpeech',
  'speechToText',
  'imageSearch',
]

const STATUS_SHORT: Record<string, string> = {
  available: 'ready',
  'not-configured': 'not configured',
  unavailable: 'offline',
  error: 'error',
}

const STATUS_DOT: Record<string, string> = {
  available: 'bg-emerald-500',
  'not-configured': 'bg-zinc-500',
  unavailable: 'bg-red-400',
  error: 'bg-red-400',
}

function shortStatus(p: ProviderInfo): string {
  return STATUS_SHORT[p.status] ?? p.status
}

export function ProvidersView() {
  const providers = useFireLab((s) => s.providers)
  const loading = useFireLab((s) => s.providersLoading)
  const refreshProviders = useFireLab((s) => s.refreshProviders)
  const reorderProviders = useFireLab((s) => s.reorderProviders)
  const [testing, setTesting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, ProviderTestResult>>({})
  const [spin, setSpin] = useState(false)
  const [kindFilter, setKindFilter] = useState<ProviderKind | 'all'>('all')
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const ready = providers.filter((p) => p.status === 'available').length
  const kindCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of providers) map.set(p.kind, (map.get(p.kind) ?? 0) + 1)
    return map
  }, [providers])

  const q = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      providers.filter((p) => {
        if (kindFilter !== 'all' && p.kind !== kindFilter) return false
        if (!q) return true
        return `${p.name} ${p.id} ${p.envVars.join(' ')}`.toLowerCase().includes(q)
      }),
    [providers, kindFilter, q]
  )

  const toggleOpen = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onTest = async (id: string) => {
    setTesting(id)
    try {
      const result = await testProviderConnection(id)
      setResults((r) => ({ ...r, [id]: result }))
      if (result.ok) {
        toast.success(`${id} · all checks passed`, { description: `${result.latencyMs ?? 0} ms` })
      } else {
        toast.error(`${id} · check failed`, { description: result.message })
      }
    } catch (err) {
      toast.error('Test failed', { description: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setTesting(null)
    }
  }

  /** Reorder works on the full priority order, even when the list is filtered. */
  const move = (p: ProviderInfo, dir: -1 | 1) => {
    const order = providers.map((x) => x.id)
    const index = order.indexOf(p.id)
    const target = index + dir
    if (index < 0 || target < 0 || target >= order.length) return
    ;[order[index], order[target]] = [order[target], order[index]]
    void reorderProviders(order)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="micro-label">Architecture</p>
            <h1 className="font-display mt-1 text-3xl italic text-foreground">
              AI <span className="text-ember">Providers</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Twenty-nine connections, one contract. The built-in engine works with zero keys; local
              runtimes join when they are running; Pollinations is a keyless cloud fallback; keyed
              clouds activate only when you add a key to{' '}
              <code className="rounded bg-secondary px-1 font-mono text-xs">.env.local</code> on the
              server — and the demo engine is a labeled last resort, never fake AI. When one fails,
              FireLab falls back down this order automatically.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setSpin(true)
              void refreshProviders().finally(() => setSpin(false))
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>

        {/* summary strip */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border bg-secondary/30 px-3 py-2.5 text-xs">
          <span className="font-medium text-foreground">
            {providers.length} connections · <span className="text-ember">{ready}</span> ready now
          </span>
          <span className="text-muted-foreground" aria-label="Kind breakdown">
            Builtin {kindCounts.get('builtin') ?? 0} · Local {kindCounts.get('local') ?? 0} · Cloud{' '}
            {kindCounts.get('cloud') ?? 0} · Demo {kindCounts.get('demo') ?? 0}
          </span>
        </div>

        {/* kind filter + search */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter providers by kind"
          >
            {KIND_FILTERS.map((k) => {
              const active = kindFilter === k.id
              const count = k.id === 'all' ? providers.length : (kindCounts.get(k.id) ?? 0)
              return (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setKindFilter(k.id)}
                  className={`focus-ember h-9 rounded-full border px-3 text-xs transition ${
                    active
                      ? 'border-ember/70 bg-accent text-ember'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {k.label}
                  <span className="ml-1 text-[10px] text-muted-foreground/70">{count}</span>
                </button>
              )
            })}
          </div>
          <div className="relative ml-auto w-full max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="name · id · env var"
              aria-label="Search providers"
              className="h-9 border-border bg-secondary/30 pl-9 text-xs"
            />
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-md border border-emerald-600/25 bg-emerald-500/5 px-3 py-2.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
          <p>
            <span className="text-foreground/90">Secrets never touch the browser.</span> Keys are read
            server-side from environment variables only — never in the repo, never in client code, never in
            logs. The demo engine is a labeled last-resort fallback, not fake AI.
          </p>
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 pb-8 sm:px-8">
        {loading && providers.length === 0 && (
          <p className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Probing providers…
          </p>
        )}

        <div className="mx-auto max-w-4xl space-y-2.5 pt-4" aria-label="Provider list in priority order">
          {visible.map((p) => {
            const index = providers.findIndex((x) => x.id === p.id)
            const badge = KIND_BADGES[p.kind] ?? KIND_BADGES.cloud
            const open = openIds.has(p.id)
            const result = results[p.id]
            return (
              <Collapsible key={p.id} open={open} onOpenChange={() => toggleOpen(p.id)}>
                <article className="rounded-lg border bg-card/50">
                  <CollapsibleTrigger className="focus-ember flex w-full items-center gap-2.5 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary/40">
                    <span className="w-7 shrink-0 font-mono text-[11px] text-muted-foreground/60">
                      #{index + 1}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[p.status] ?? 'bg-zinc-500'}`}
                      title={p.statusDetail ?? p.status}
                      aria-hidden="true"
                    />
                    <span className="truncate text-sm font-semibold text-foreground">{p.name}</span>
                    <Badge variant="outline" className={`shrink-0 text-[9px] tracking-widest ${badge.className}`}>
                      {badge.label}
                    </Badge>
                    <span className="ml-auto hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                      {shortStatus(p)}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="space-y-3 border-t px-4 py-4 sm:px-5">
                      <p className="text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                      {p.statusDetail && (
                        <p className="text-[11px] text-muted-foreground/70">{p.statusDetail}</p>
                      )}
                      {p.note && <p className="text-[11px] text-amber-500/90">{p.note}</p>}

                      <div className="flex flex-wrap gap-1.5">
                        {ORDERED_CAPS.filter((c) => p.capabilities[c]).map((c) => (
                          <span
                            key={c}
                            className="rounded-full border bg-secondary/40 px-2 py-0.5 text-[10px] text-foreground/70"
                          >
                            {CAPABILITY_LABELS[c]}
                          </span>
                        ))}
                        {ORDERED_CAPS.every((c) => !p.capabilities[c]) && (
                          <span className="text-[11px] text-muted-foreground/60">
                            No capabilities in this session.
                          </span>
                        )}
                      </div>

                      {p.models.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="micro-label !text-[9px]">models</span>
                          {p.models.map((m) => (
                            <span
                              key={m.id}
                              title={m.note ?? m.status}
                              className={`rounded border bg-secondary/40 px-1.5 py-0.5 font-mono text-[10px] ${
                                m.status === 'available'
                                  ? 'text-foreground/70'
                                  : 'text-muted-foreground/70'
                              }`}
                            >
                              {m.label}
                            </span>
                          ))}
                        </div>
                      )}

                      {p.envVars.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="micro-label !text-[9px]">env</span>
                          {p.envVars.map((v) => (
                            <code
                              key={v}
                              className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                            >
                              {v}
                            </code>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 gap-1.5 text-xs"
                          onClick={() => void onTest(p.id)}
                          disabled={testing === p.id}
                        >
                          {testing === p.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plug className="h-3.5 w-3.5" />
                          )}
                          Test connection
                        </Button>
                        {p.docsUrl && (
                          <a
                            href={p.docsUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                          >
                            docs <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => move(p, -1)}
                            disabled={index === 0}
                            aria-label="Increase priority"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => move(p, 1)}
                            disabled={index === providers.length - 1}
                            aria-label="Decrease priority"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {result && (
                        <div className="space-y-1 rounded-md border bg-secondary/30 p-3">
                          <p
                            className={`text-xs font-medium ${result.ok ? 'text-emerald-500' : 'text-destructive'}`}
                          >
                            {result.message}
                          </p>
                          <Separator className="my-2 bg-border" />
                          {result.checks.map((c, i) => (
                            <p
                              key={i}
                              className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground"
                            >
                              {c.ok ? (
                                <CheckCircle2
                                  className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500"
                                  aria-hidden="true"
                                />
                              ) : (
                                <XCircle
                                  className="mt-0.5 h-3 w-3 shrink-0 text-red-400"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                <span className="text-foreground/80">{c.label}:</span> {c.detail}
                              </span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </article>
              </Collapsible>
            )
          })}

          {!loading && visible.length === 0 && (
            <p className="mt-8 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No providers match the current filter.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

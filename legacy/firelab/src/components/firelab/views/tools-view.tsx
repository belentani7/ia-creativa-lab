'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Search, Wrench } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useFireLab } from '@/lib/firelab/store'
import type { ProviderInfo } from '@/lib/firelab/types'
import {
  CATEGORIES,
  TOOLS_CATALOG,
  TOOL_CAPABILITY,
  defaultPrefillField,
  type CatalogBadge,
  type CatalogCategory,
  type CatalogTool,
} from '@/lib/firelab/tools-catalog'

const BADGE_STYLES: Record<CatalogBadge, { label: string; className: string }> = {
  native: { label: 'NATIVE', className: 'border-ember/50 bg-ember/10 text-ember' },
  template: { label: 'TEMPLATE', className: 'border-zinc-600/50 bg-zinc-500/10 text-zinc-400' },
  local: { label: 'LOCAL', className: 'border-emerald-600/40 bg-emerald-500/10 text-emerald-500' },
  experimental: { label: 'EXPERIMENTAL', className: 'border-amber-600/40 bg-amber-500/10 text-amber-500' },
}

type CategoryFilter = CatalogCategory | 'all'

type Availability =
  | { state: 'local'; aiProviders?: ProviderInfo[] }
  | { state: 'available'; providers: ProviderInfo[] }
  | { state: 'needs-provider'; hint: string }

function resolveAvailability(entry: CatalogTool, providers: ProviderInfo[]): Availability {
  const caps = entry.capabilities ?? (entry.tool ? [TOOL_CAPABILITY[entry.tool]] : undefined)
  const required = (caps ?? []).filter((c): c is NonNullable<typeof c> => Boolean(c))
  if (required.length === 0) return { state: 'local' }
  const supporting = providers.filter((p) => p.configured && required.every((c) => p.capabilities[c]))
  if (entry.local) return { state: 'local', aiProviders: supporting }
  if (supporting.length > 0) return { state: 'available', providers: supporting }
  return {
    state: 'needs-provider',
    hint:
      entry.badge === 'experimental'
        ? 'Experimental — needs fal / Replicate key'
        : 'No connection supports this yet — configure one in Providers',
  }
}

function shortName(p: ProviderInfo): string {
  return p.name.split(' (')[0]
}

function AvailabilityLine({ entry, providers }: { entry: CatalogTool; providers: ProviderInfo[] }) {
  const a = resolveAvailability(entry, providers)
  if (a.state === 'local') {
    return (
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
        <span>
          Runs in your browser — instant, offline
          {a.aiProviders && a.aiProviders.length > 0
            ? ` · AI pass optional via ${shortName(a.aiProviders[0])}`
            : ''}
        </span>
      </p>
    )
  }
  if (a.state === 'available') {
    const names = a.providers.slice(0, 2).map(shortName).join(', ')
    return (
      <p
        className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground"
        title={`Supported by ${a.providers.map(shortName).join(', ')}`}
      >
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
        <span>available now · via {names}</span>
      </p>
    )
  }
  return (
    <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-zinc-400" role="status">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
      <span>{a.hint}</span>
    </p>
  )
}

function ToolCard({
  entry,
  providers,
  onOpen,
}: {
  entry: CatalogTool
  providers: ProviderInfo[]
  onOpen: (entry: CatalogTool) => void
}) {
  const badge = BADGE_STYLES[entry.badge ?? 'template']
  return (
    <Card
      role="button"
      tabIndex={0}
      aria-label={`Open ${entry.name} — ${entry.tagline}`}
      onClick={() => onOpen(entry)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(entry)
        }
      }}
      className="focus-ember group cursor-pointer gap-2 p-4 transition-colors hover:border-ember/60"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight text-foreground group-hover:text-ember">
          {entry.name}
        </h3>
        <Badge variant="outline" className={`shrink-0 text-[9px] tracking-widest ${badge.className}`}>
          {badge.label}
        </Badge>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{entry.tagline}</p>
      {entry.promptTemplate && (
        <p
          className="line-clamp-2 rounded border bg-secondary/40 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-muted-foreground/80"
          title={entry.promptTemplate}
        >
          {entry.promptTemplate}
        </p>
      )}
      <div className="mt-auto pt-1">
        <AvailabilityLine entry={entry} providers={providers} />
      </div>
    </Card>
  )
}

export function ToolsView() {
  const providers = useFireLab((s) => s.providers)
  const providersLoading = useFireLab((s) => s.providersLoading)
  const providersError = useFireLab((s) => s.providersError)
  const refreshProviders = useFireLab((s) => s.refreshProviders)

  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')

  // keep the provider list warm for live availability
  useEffect(() => {
    if (providers.length === 0 || providersError) void refreshProviders()
  }, [providers.length, providersError, refreshProviders])

  // 200 ms search debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 200)
    return () => clearTimeout(t)
  }, [query])

  const counts = useMemo(() => {
    const map = new Map<CatalogCategory, number>()
    for (const t of TOOLS_CATALOG) map.set(t.category, (map.get(t.category) ?? 0) + 1)
    return map
  }, [])

  const availableNow = useMemo(() => {
    if (providers.length === 0 && providersLoading) return null
    return TOOLS_CATALOG.filter((t) => resolveAvailability(t, providers).state !== 'needs-provider')
      .length
  }, [providers, providersLoading])

  const visible = useMemo(() => {
    const q = debounced
    return TOOLS_CATALOG.filter((t) => {
      if (category !== 'all' && t.category !== category) return false
      if (!q) return true
      return `${t.name} ${t.tagline} ${t.tags.join(' ')}`.toLowerCase().includes(q)
    })
  }, [category, debounced])

  const openTool = (entry: CatalogTool) => {
    const s = useFireLab.getState()
    if (!entry.tool) return
    if (entry.id === 'fast-draft') {
      // arm the 1.5× read before the panel mounts
      s.set('speechSpeed', 1.5)
    }
    if (entry.promptTemplate) {
      const field = entry.prefillField ?? defaultPrefillField(entry.tool)
      s.set(field, entry.promptTemplate)
    }
    s.setTool(entry.tool)
    s.setView('studio')

    if (entry.id === 'prompt-enhance' || entry.id === 'enhance-prompt-image') {
      // let the Generate panel mount, then run its Enhance flow
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('firelab:enhance-prompt')), 150)
      toast('Enhance armed', {
        description:
          'Generate panel open — the LLM rewrite runs on your current prompt (write one first if the canvas is blank).',
      })
      return
    }
    if (entry.promptTemplate) {
      if (entry.prefillField === 'negativePrompt') {
        toast.success('Negative starter loaded', {
          description:
            'The negative field appears when the active provider supports negatives — e.g. qwen, nvidia, stability or a local A1111.',
        })
      } else if (entry.tool === 'speech') {
        toast.success('Template loaded — review and generate', {
          description: 'Script prefilled into the speech panel — pick a voice and speak.',
        })
      } else if (entry.tool === 'image-search') {
        toast.success('Template loaded — review and generate', {
          description: 'Query prefilled — edit the {placeholders}, then search.',
        })
      } else {
        toast.success('Template loaded — review and generate', {
          description: 'Edit the {placeholders} in the panel, then run.',
        })
      }
    } else if (entry.id === 'fast-draft') {
      toast('Fast-draft armed', {
        description: 'Speech panel open at 1.5× speed — paste a script and read.',
      })
    } else {
      toast(`${entry.name} opened`, {
        description: entry.local
          ? 'Local — runs in your browser, no provider needed.'
          : 'Panel open in the studio.',
      })
    }
  }

  const resolving = providers.length === 0 && providersLoading

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 sm:px-8">
        <p className="micro-label">Recipe book</p>
        <h1 className="font-display mt-1 text-3xl italic text-foreground">
          To<span className="text-ember">ols</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {TOOLS_CATALOG.length} recipes over real capabilities — every card opens a native panel, and
          templates prefill its prompt. Nothing here fakes what the runtime cannot do: availability is
          resolved live from your configured connections.
        </p>
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          {TOOLS_CATALOG.length} recipes ·{' '}
          {availableNow === null ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> resolving availability…
            </span>
          ) : (
            <>
              <span className="text-ember">{availableNow}</span> available now
            </>
          )}
        </p>

        <div className="mt-4 flex items-center gap-2">
          <div className="relative w-full max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recipes — name, vibe, keyword…"
              aria-label="Search tools"
              className="h-11 border-border bg-secondary/30 pl-9 text-sm"
            />
          </div>
          {query && (
            <span className="text-xs text-muted-foreground" aria-live="polite">
              {visible.length} match{visible.length === 1 ? '' : 'es'}
            </span>
          )}
        </div>

        <div
          className="scroll-thin mt-3 flex gap-1.5 overflow-x-auto pb-2"
          role="group"
          aria-label="Filter by category"
        >
          <button
            type="button"
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
            className={`focus-ember h-11 shrink-0 rounded-full border px-3.5 text-xs transition ${
              category === 'all'
                ? 'border-ember/70 bg-accent text-ember'
                : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
            }`}
          >
            All <span className="ml-1 text-[10px] text-muted-foreground/70">{TOOLS_CATALOG.length}</span>
          </button>
          {CATEGORIES.map((c) => {
            const active = category === c.id
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c.id)}
                title={c.blurb}
                className={`focus-ember h-11 shrink-0 rounded-full border px-3.5 text-xs transition ${
                  active
                    ? 'border-ember/70 bg-accent text-ember'
                    : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label} <span className="ml-1 text-[10px] text-muted-foreground/70">{counts.get(c.id) ?? 0}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-6 pb-8 sm:px-8">
        {visible.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <Wrench className="mx-auto h-5 w-5 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">
              No tools match &ldquo;{query.trim()}&rdquo;
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try a shorter keyword — or clear the search to browse all {TOOLS_CATALOG.length}.
            </p>
          </div>
        ) : (
          <div
            className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3"
            aria-label={`Tools list — ${visible.length} recipes`}
          >
            {resolving && (
              <p className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Probing connections for
                availability…
              </p>
            )}
            {visible.map((entry) => (
              <ToolCard key={entry.id} entry={entry} providers={providers} onOpen={openTool} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

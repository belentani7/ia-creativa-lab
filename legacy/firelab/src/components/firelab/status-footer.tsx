'use client'

import { useFireLab } from '@/lib/firelab/store'

/** AUTO fallback chain, derived live from the provider registry (priority order). */
function autoChain(providers: { configured: boolean; name: string }[], allowDemo: boolean): string {
  const names = providers
    .filter((p) => p.configured)
    .slice(0, 5)
    .map((p) => p.name.split(' (')[0])
  if (allowDemo) names.push('demo')
  return names.join(' → ')
}

export function StatusFooter() {
  const providers = useFireLab((s) => s.providers)
  const providerMode = useFireLab((s) => s.providerMode)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const view = useFireLab((s) => s.view)

  const chain =
    providerMode === 'auto'
      ? autoChain(providers, allowDemo)
      : providers.find((p) => p.id === providerMode)?.name ?? providerMode

  return (
    <footer
      className="flex h-7 shrink-0 items-center gap-4 border-t bg-background px-3 text-[10px] tracking-wide text-muted-foreground/80"
      role="contentinfo"
    >
      <span className="hidden items-center gap-1.5 sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        LOCAL-FIRST · CLOUD OPTIONAL
      </span>
      <span className="hidden truncate md:inline-block">
        {providerMode === 'auto' ? 'AUTO · ' : 'MANUAL · '}
        {chain || 'no provider configured'}
      </span>
      <span className="ml-auto hidden truncate lg:inline-block">
        {view === 'studio'
          ? 'B brush · E erase · I invert · M mask · C compare · V video · A adjust · Space pan · 0 fit'
          : 'BELENTANI FIRELAB'}
      </span>
      <span className="shrink-0">v0.1.0 · not affiliated with Adobe</span>
    </footer>
  )
}

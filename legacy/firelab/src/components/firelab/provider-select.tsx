'use client'

import { Info } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFireLab } from '@/lib/firelab/store'
import type { Capability, ProviderInfo } from '@/lib/firelab/types'

/** Which provider AUTO mode would use right now for a capability. */
export function resolveAutoProvider(
  providers: ProviderInfo[],
  capability: Capability
): ProviderInfo | null {
  return providers.find((p) => p.configured && p.capabilities[capability]) ?? null
}

interface ProviderSelectProps {
  capability: Capability
  value: string
  onChange: (value: string) => void
  includeDemo?: boolean
}

export function ProviderSelect({ capability, value, onChange, includeDemo = false }: ProviderSelectProps) {
  const providers = useFireLab((s) => s.providers)
  const allowDemo = useFireLab((s) => s.allowDemo)

  const capable = providers.filter((p) => {
    if (p.id === 'demo') return includeDemo && allowDemo
    return p.capabilities[capability]
  })

  const auto = resolveAutoProvider(providers, capability)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="micro-label">Provider</span>
        {value === 'auto' && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Info className="h-3 w-3" aria-hidden="true" />
            resolves to {auto ? auto.name.split(' (')[0] : 'none'}
          </span>
        )}
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-label="AI provider">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">
            AUTO · automatic fallback ({capable.filter((p) => p.configured).length} available)
          </SelectItem>
          {capable.map((p) => (
            <SelectItem key={p.id} value={p.id} disabled={!p.configured && p.id !== 'demo'}>
              {p.name}
              {p.configured ? '' : ' · not configured'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CapabilityNotice({
  providers,
  providerMode,
  capability,
  label,
}: {
  providers: ProviderInfo[]
  providerMode: string
  capability: Capability
  label: string
}) {
  if (providerMode === 'auto') return null
  const provider = providers.find((p) => p.id === providerMode)
  if (!provider || provider.capabilities[capability]) return null
  const alternatives = providers.filter((p) => p.configured && p.capabilities[capability])
  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-foreground"
    >
      <p className="font-medium text-destructive">
        {provider.name} does not support {label}.
      </p>
      {alternatives.length > 0 ? (
        <p className="mt-1 text-muted-foreground">
          Available for this operation: {alternatives.map((a) => a.name.split(' (')[0]).join(', ')}. Switch
          to AUTO or one of these.
        </p>
      ) : (
        <p className="mt-1 text-muted-foreground">No configured provider supports it right now.</p>
      )}
    </div>
  )
}

'use client'

import { useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { Cpu, Monitor, Moon, RotateCcw, Sun, TriangleAlert } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useFireLab } from '@/lib/firelab/store'
import { setProviderPriority } from '@/lib/firelab/api-client'

/** Mirrors the server-side defaultPriority order (server module is backend-only). */
const DEFAULT_PROVIDER_ORDER = [
  'builtin',
  'qwen',
  'nvidia',
  'comfyui',
  'ollama',
  'huggingface',
  'demo',
]

const SHORTCUTS: [string, string][] = [
  ['B', 'activate mask brush'],
  ['E', 'toggle brush / eraser'],
  ['I', 'invert mask'],
  ['M', 'toggle mask mode'],
  ['C (hold)', 'compare with original'],
  ['[ / ]', 'brush size'],
  ['Space (hold) + drag', 'pan'],
  ['Wheel', 'zoom at cursor'],
  ['0 / 1', 'fit / 100%'],
  ['Ctrl+Z / Ctrl+Shift+Z', 'undo / redo'],
  ['Ctrl+S', 'save project'],
  ['Ctrl+V', 'paste image'],
]

interface HardwareInfo {
  webgpu: boolean
  cores: number
  memoryGB: number | null
  platform: string
  profile: 'LOW' | 'MEDIUM' | 'HIGH' | 'LOCAL POWER USER'
}

function detectHardware(): HardwareInfo {
  const nav = navigator as Navigator & { deviceMemory?: number; gpu?: unknown }
  const webgpu = typeof nav.gpu !== 'undefined'
  const cores = nav.hardwareConcurrency || 2
  const memoryGB = nav.deviceMemory ?? null
  let profile: HardwareInfo['profile'] = 'LOW'
  if (webgpu && cores >= 8 && (memoryGB ?? 4) >= 8) profile = 'LOCAL POWER USER'
  else if (webgpu && cores >= 4) profile = 'HIGH'
  else if (cores >= 4) profile = 'MEDIUM'
  return { webgpu, cores, memoryGB, platform: navigator.platform || 'unknown', profile }
}

let cachedHardware: HardwareInfo | null = null

function subscribeNoop(): () => void {
  return () => undefined
}

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const allowDemo = useFireLab((s) => s.allowDemo)
  const setAllowDemo = useFireLab((s) => s.setAllowDemo)
  const providerMode = useFireLab((s) => s.providerMode)
  const setProviderMode = useFireLab((s) => s.setProviderMode)
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
  const hardware = useSyncExternalStore(
    subscribeNoop,
    () => {
      cachedHardware ??= detectHardware()
      return cachedHardware
    },
    () => null
  )

  const onResetOrder = async () => {
    try {
      await setProviderPriority(DEFAULT_PROVIDER_ORDER)
      await useFireLab.getState().refreshProviders()
      toast.success('Provider order reset', { description: 'built-in → cloud boosters → demo last.' })
    } catch {
      toast.error('Reset failed')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 p-6 sm:p-8">
      <div>
        <p className="micro-label">Preferences</p>
        <h1 className="font-display mt-1 text-3xl italic text-foreground">
          Set<span className="text-ember">tings</span>
        </h1>
      </div>

      {/* appearance */}
      <section aria-label="Appearance" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
        <div className="flex items-center justify-between rounded-lg border bg-card/50 p-4">
          <div className="space-y-0.5">
            <Label className="text-sm">Theme</Label>
            <p className="text-xs text-muted-foreground">Dark is the native FireLab look.</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={theme === 'dark' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme('dark')}
              aria-label="Dark theme"
              title="Dark"
            >
              <Moon className="h-4 w-4" />
            </Button>
            <Button
              variant={theme === 'light' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme('light')}
              aria-label="Light theme"
              title="Light"
            >
              <Sun className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* generation */}
      <section aria-label="Generation" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Generation</h2>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-card/50 p-4">
          <div className="space-y-0.5">
            <Label htmlFor="fl-demo" className="text-sm">Demo fallback</Label>
            <p className="text-xs leading-relaxed text-muted-foreground">
              When every real provider fails, show a clearly-labeled deterministic placeholder instead of
              an error. Never presented as AI.
            </p>
          </div>
          <Switch id="fl-demo" checked={allowDemo} onCheckedChange={setAllowDemo} />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-card/50 p-4">
          <div className="space-y-0.5">
            <Label className="text-sm">Provider mode</Label>
            <p className="text-xs text-muted-foreground">
              {providerMode === 'auto'
                ? 'AUTO — automatic fallback across the priority chain.'
                : `Manual: ${providerMode}. No fallback when it fails.`}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setProviderMode('auto')} disabled={providerMode === 'auto'}>
            Use AUTO
          </Button>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-card/50 p-4">
          <div className="space-y-0.5">
            <Label className="text-sm">Provider priority</Label>
            <p className="text-xs text-muted-foreground">Reset the fallback chain to defaults.</p>
          </div>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => void onResetOrder()}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset order
          </Button>
        </div>
      </section>

      {/* hardware */}
      <section aria-label="Hardware" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Hardware detection</h2>
        <div className="rounded-lg border bg-card/50 p-4">
          {!mounted || !hardware ? (
            <p className="text-xs text-muted-foreground">Detecting…</p>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 text-foreground">
                <Monitor className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                profile: <span className="text-ember">{hardware.profile}</span>
              </p>
              <p className="flex items-center gap-2">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                {hardware.cores} logical cores · {hardware.memoryGB ? `${hardware.memoryGB}+ GB RAM (exposed)` : 'RAM not exposed by browser'}
              </p>
              <p>
                WebGPU: {hardware.webgpu ? 'available' : 'not available'} · platform {hardware.platform}
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Browsers only expose coarse hardware signals. This profile guides future in-browser
                inference (WebGPU roadmap) — the current engine runs server-side and works regardless.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* shortcuts */}
      <section aria-label="Keyboard shortcuts" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
        <div className="grid gap-1.5 rounded-lg border bg-card/50 p-4 sm:grid-cols-2">
          {SHORTCUTS.map(([key, desc]) => (
            <p key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="min-w-14 rounded border bg-secondary px-1.5 py-0.5 text-center font-mono text-[10px] text-foreground/80">
                {key}
              </kbd>
              {desc}
            </p>
          ))}
        </div>
      </section>

      {/* about */}
      <section aria-label="About" className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">About</h2>
        <div className="space-y-2 rounded-lg border bg-card/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <p>
            <span className="font-display text-sm italic text-foreground">BELENTANI // FIRELAB</span> — a
            local-first generative creative studio. Cloud is optional. Local is first. Providers are
            plugins. The UI never depends on one AI company.
          </p>
          <Separator className="bg-border" />
          <p className="flex gap-2">
            <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            Independent project inspired by the <em>capabilities</em> of generative creative tools. Not
            affiliated with, endorsed by, or connected to Adobe. No Adobe assets or trademarks are used.
          </p>
          <p>
            Data stays local: projects, history and assets live in this machine’s SQLite database; edits
            and keying happen in your browser. Delete <code className="rounded bg-secondary px-1 font-mono">db/</code> to wipe
            everything.
          </p>
        </div>
      </section>
    </div>
  )
}

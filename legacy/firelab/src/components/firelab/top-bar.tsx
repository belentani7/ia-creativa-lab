'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Loader2, PanelRight, Save, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { createProject, updateProject, uploadAsset } from '@/lib/firelab/api-client'
import { downloadBlob } from '@/lib/firelab/imageops'
import type { ProviderInfo } from '@/lib/firelab/types'

function resolveAutoProvider(providers: ProviderInfo[], capability: keyof ProviderInfo['capabilities']): ProviderInfo | null {
  return providers.find((p) => p.configured && p.capabilities[capability]) ?? null
}

export function TopBar({ runningJobs }: { runningJobs: number }) {
  const projectName = useFireLab((s) => s.projectName)
  const projectId = useFireLab((s) => s.projectId)
  const dirty = useFireLab((s) => s.dirty)
  const providers = useFireLab((s) => s.providers)
  const providerMode = useFireLab((s) => s.providerMode)
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const setView = useFireLab((s) => s.setView)
  const set = useFireLab((s) => s.set)
  const markDirty = useFireLab((s) => s.markDirty)
  const setProject = useFireLab((s) => s.setProject)
  const rightPanelOpen = useFireLab((s) => s.rightPanelOpen)

  const [saving, setSaving] = useState(false)

  const activeProvider =
    providerMode === 'auto'
      ? resolveAutoProvider(providers, 'textToImage')
      : providers.find((p) => p.id === providerMode) ?? null

  const onSave = useCallback(async () => {
    const engine = getEngine()
    if (!engine.hasImage()) {
      toast.error('Nothing to save yet', {
        description: 'Generate or import an image first.',
      })
      return
    }
    setSaving(true)
    try {
      const state = useFireLab.getState()
      let id = state.projectId
      if (!id) {
        const project = await createProject(state.projectName)
        id = project.id
        setProject(id, project.name)
      }
      const imageAsset = await uploadAsset(engine.getImageDataUrl('image/png'))
      const maskDataUrl = engine.maskDataUrl()
      const maskAsset = maskDataUrl ? await uploadAsset(maskDataUrl) : null
      const size = engine.imageSize()
      await updateProject(id, {
        name: state.projectName,
        canvas: {
          imageAssetId: imageAsset.id,
          maskAssetId: maskAsset?.id ?? undefined,
          width: size.width,
          height: size.height,
          prompt: state.prompt,
          tool: state.tool,
          savedAt: new Date().toISOString(),
        },
      })
      markDirty(false)
      toast.success('Project saved', {
        description: `${state.projectName} · image + mask stored locally.`,
      })
    } catch (err) {
      toast.error('Save failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
    }
  }, [markDirty, setProject])

  // listen for Ctrl+S shortcut event
  useEffect(() => {
    const handler = () => void onSave()
    window.addEventListener('firelab:save-project', handler)
    return () => window.removeEventListener('firelab:save-project', handler)
  }, [onSave])

  const onExport = useCallback(
    async (format: 'png' | 'jpeg' | 'webp') => {
      const engine = getEngine()
      if (!engine.hasImage()) {
        toast.error('Nothing to export yet')
        return
      }
      const mime = `image/${format}`
      const quality = format === 'png' ? undefined : 0.92
      const blob = await engine.exportBlob(mime, quality)
      if (!blob) {
        toast.error('Export failed', { description: 'The canvas could not be encoded.' })
        return
      }
      const ext = format === 'jpeg' ? 'jpg' : format
      const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'untitled'
      downloadBlob(blob, `firelab-${slug}-${Date.now().toString(36)}.${ext}`)
      toast.success(`Exported ${ext.toUpperCase()}`, {
        description: format === 'png'
          ? 'PNG preserves transparency (background removal results).'
          : 'Quality 92%.',
      })
    },
    [projectName]
  )

  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b bg-card/60 px-3 backdrop-blur-sm sm:px-4">
      <div className="flex select-none items-baseline gap-2" aria-label="BELENTANI FIRELAB">
        <span className="micro-label hidden !text-foreground/70 sm:inline">BELENTANI</span>
        <span className="font-display text-lg italic leading-none text-ember">FireLab</span>
      </div>

      <div className="mx-1 hidden h-5 w-px bg-border md:block" />

      <input
        value={projectName}
        onChange={(e) => {
          set('projectName', e.target.value)
          markDirty(true)
        }}
        aria-label="Project name"
        className="w-32 rounded-sm bg-transparent px-2 py-1 text-sm text-foreground/90 outline-none transition hover:bg-secondary focus:bg-secondary focus-visible:ring-1 focus-visible:ring-ring sm:w-44"
        placeholder="Untitled"
      />
      {dirty && imageLoaded && (
        <span className="micro-label !tracking-normal text-ember" title="Unsaved changes">
          ●
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {runningJobs > 0 && (
          <span className="flex items-center gap-1.5 rounded-full border bg-secondary/60 px-2.5 py-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            {runningJobs} running
          </span>
        )}

        <button
          type="button"
          onClick={() => setView('providers')}
          className="focus-ember hidden items-center gap-2 rounded-md border bg-secondary/40 px-2.5 py-1.5 text-xs transition hover:bg-secondary sm:flex"
          title="AI providers"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              activeProvider
                ? activeProvider.id === 'demo'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
                : 'bg-red-500'
            }`}
            aria-hidden="true"
          />
          <span className="max-w-36 truncate text-foreground/80">
            {providerMode === 'auto'
              ? `AUTO · ${activeProvider?.name ?? 'no provider'}`
              : activeProvider?.name ?? providerMode}
          </span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => void onSave()}
          disabled={saving || !imageLoaded}
          className="gap-1.5"
          title="Save project (Ctrl+S)"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span className="hidden sm:inline">Save</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" disabled={!imageLoaded} className="gap-1.5" title="Export">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="micro-label">Export canvas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void onExport('png')}>
              <Check className="h-4 w-4 text-ember" /> PNG · lossless + alpha
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void onExport('jpeg')}>
              <Check className="h-4 w-4 opacity-0" /> JPG · quality 92
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void onExport('webp')}>
              <Check className="h-4 w-4 opacity-0" /> WEBP · quality 92
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden"
          onClick={() => set('rightPanelOpen', !rightPanelOpen)}
          title="Toggle parameters panel"
          aria-label="Toggle parameters panel"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

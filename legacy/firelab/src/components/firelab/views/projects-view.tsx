'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FolderOpen, Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import {
  createProject,
  deleteProject,
  fetchProjects,
  assetToDataUrl,
  type ProjectDTO,
} from '@/lib/firelab/api-client'

export function ProjectsView() {
  const [projects, setProjects] = useState<ProjectDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const setProject = useFireLab((s) => s.setProject)
  const setView = useFireLab((s) => s.setView)
  const markDirty = useFireLab((s) => s.markDirty)
  const prompt = useFireLab((s) => s.prompt)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await fetchProjects())
    } catch {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onOpen = async (project: ProjectDTO) => {
    try {
      if (!project.canvas?.imageAssetId) {
        toast.error('This project has no saved image')
        return
      }
      const dataUrl = await assetToDataUrl(`/api/firelab/assets/${project.canvas.imageAssetId}`)
      const engine = getEngine()
      engine.reset()
      await engine.loadImageFromDataUrl(dataUrl)
      if (project.canvas.maskAssetId) {
        const maskUrl = await assetToDataUrl(`/api/firelab/assets/${project.canvas.maskAssetId}`)
        await engine.loadMaskFromDataUrl(maskUrl)
      }
      setProject(project.id, project.name, false)
      if (project.canvas.prompt) {
        useFireLab.getState().set('prompt', project.canvas.prompt)
      }
      setView('studio')
      toast.success(`Opened “${project.name}”`, {
        description: `${project.canvas.width ?? '?'} × ${project.canvas.height ?? '?'} px${project.canvas.maskAssetId ? ' + mask' : ''}`,
      })
    } catch (err) {
      toast.error('Failed to open project', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const onCreate = async () => {
    if (creating) return
    setCreating(true)
    try {
      const project = await createProject(newName.trim() || 'Untitled')
      setProject(project.id, project.name, false)
      if (prompt) markDirty(true)
      setNewName('')
      await load()
      setView('studio')
      toast.success('Project created')
    } catch (err) {
      toast.error('Failed to create project', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setCreating(false)
    }
  }

  const onDelete = async (project: ProjectDTO) => {
    if (!window.confirm(`Delete project “${project.name}”? Its saved image and mask will be removed.`)) {
      return
    }
    try {
      await deleteProject(project.id)
      const state = useFireLab.getState()
      if (state.projectId === project.id) {
        setProject(null, 'Untitled', false)
      }
      await load()
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 sm:p-8">
      <p className="micro-label">Workspace</p>
      <h1 className="font-display mt-1 text-3xl italic text-foreground">
        Pro<span className="text-ember">jects</span>
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Projects store the canvas image, the mask, the prompt and the active tool — locally (SQLite on
        this machine). Use <strong className="text-foreground/80">Save (Ctrl+S)</strong> in the studio to
        snapshot the current state.
      </p>

      <div className="mt-6 flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name…"
          className="max-w-xs border-border bg-secondary/30 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && void onCreate()}
          aria-label="New project name"
        />
        <Button onClick={() => void onCreate()} disabled={creating} className="gap-1.5">
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} New
        </Button>
      </div>

      <div className="mt-8 space-y-3">
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading projects…
          </p>
        )}
        {!loading && projects.length === 0 && (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No projects yet — save one from the studio with Ctrl+S.
          </p>
        )}
        {projects.map((p) => (
          <article
            key={p.id}
            className="flex items-center gap-4 rounded-lg border bg-card/50 p-4 transition hover:border-ember/40"
          >
            <button
              type="button"
              className="focus-ember h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-secondary/40"
              onClick={() => void onOpen(p)}
              aria-label={`Open project ${p.name}`}
            >
              {p.canvas?.imageAssetId ? (
                <img
                  src={`/api/firelab/assets/${p.canvas.imageAssetId}?t=thumb`}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[9px] uppercase tracking-widest text-muted-foreground">
                  empty
                </span>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-medium text-foreground">{p.name}</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {p.canvas?.width ? `${p.canvas.width} × ${p.canvas.height} px` : 'no image'} ·
                {p.canvas?.maskAssetId ? ' mask' : ' no mask'} · saved{' '}
                {p.canvas?.savedAt ? new Date(p.canvas.savedAt).toLocaleDateString() : 'never'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void onOpen(p)}>
                <FolderOpen className="h-3.5 w-3.5" /> Open
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => void onDelete(p)}
                aria-label={`Delete project ${p.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

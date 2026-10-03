'use client'

import { useEffect } from 'react'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { TopBar } from './top-bar'
import { ToolRail } from './tool-rail'
import { Viewport } from './viewport'
import { RightPanel } from './right-panel'
import { HistoryStrip } from './history-strip'
import { StatusFooter } from './status-footer'
import { ProjectsView } from './views/projects-view'
import { GalleryView } from './views/gallery-view'
import { ToolsView } from './views/tools-view'
import { ModelsView } from './views/models-view'
import { ProvidersView } from './views/providers-view'
import { SettingsView } from './views/settings-view'

export default function FireLabApp() {
  const view = useFireLab((s) => s.view)
  const brush = useFireLab((s) => s.brush)
  const maskActive = useFireLab((s) => s.maskActive)
  const imageLoaded = useFireLab((s) => s.editor.imageLoaded)
  const refreshProviders = useFireLab((s) => s.refreshProviders)
  const refreshHistory = useFireLab((s) => s.refreshHistory)
  const setEditorSignals = useFireLab((s) => s.setEditorSignals)
  const markDirty = useFireLab((s) => s.markDirty)
  const set = useFireLab((s) => s.set)

  // engine wiring + initial data
  useEffect(() => {
    void refreshProviders()
    void refreshHistory()
    const engine = getEngine()
    engine.onSignals = (s) =>
      setEditorSignals({
        imageLoaded: s.imageLoaded,
        imageSize: s.width > 8 ? { width: s.width, height: s.height } : null,
        canUndo: s.canUndo,
        canRedo: s.canRedo,
        hasMask: s.hasMask,
        zoom: s.zoom,
      })
    engine.onHistoryPush = () => markDirty(true)
    return () => {
      engine.onSignals = null
      engine.onHistoryPush = null
    }
  }, [refreshProviders, refreshHistory, setEditorSignals, markDirty])

  useEffect(() => {
    const engine = getEngine()
    engine.brush = brush
  }, [brush])

  useEffect(() => {
    const engine = getEngine()
    engine.maskActive = maskActive && imageLoaded
    engine.requestRender()
  }, [maskActive, imageLoaded])

  // ————— keyboard shortcuts —————
  useEffect(() => {
    const isTyping = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const engine = getEngine()
      const s = useFireLab.getState()
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        void (e.shiftKey ? engine.redo() : engine.undo())
        return
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        void engine.redo()
        return
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('firelab:save-project'))
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        engine.spaceHeld = true
        return
      }
      switch (e.key.toLowerCase()) {
        case 'g':
          s.setTool('generate')
          s.setView('studio')
          break
        case 'v':
          s.setTool('text-to-video')
          s.setView('studio')
          break
        case 'a':
          s.setTool('adjust')
          s.setView('studio')
          break
        case 'c':
          engine.compare = true
          engine.requestRender()
          set('comparing', true)
          break
        case 'b':
          if (s.editor.imageLoaded) s.setMaskActive(true)
          break
        case 'e':
          s.setBrush({ erase: !s.brush.erase })
          break
        case 'm':
          s.setMaskActive(!s.maskActive)
          break
        case 'i':
          engine.invertMask()
          break
        case '[':
          s.setBrush({ size: Math.max(4, s.brush.size - 8) })
          break
        case ']':
          s.setBrush({ size: Math.min(400, s.brush.size + 8) })
          break
        case '0':
          engine.fitView()
          break
        case '1':
          engine.setZoom(1)
          break
        case '=':
        case '+':
          engine.setZoom(engine.getZoom() * 1.25)
          break
        case '-':
          engine.setZoom(engine.getZoom() / 1.25)
          break
        default:
          break
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return
      const engine = getEngine()
      if (e.code === 'Space') {
        engine.spaceHeld = false
      }
      if (e.key.toLowerCase() === 'c') {
        engine.compare = false
        engine.requestRender()
        set('comparing', false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [set])

  const runningJobs = useFireLab((s) => s.jobs.filter((j) => j.status === 'running' || j.status === 'queued').length)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <div className="grain-overlay" aria-hidden="true" />
      <TopBar runningJobs={runningJobs} />
      <div className="flex min-h-0 flex-1">
        <ToolRail />
        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            {view === 'studio' ? (
              <>
                <main className="relative min-w-0 flex-1">
                  <Viewport />
                </main>
                <RightPanel />
              </>
            ) : (
              <main className="min-w-0 flex-1 overflow-y-auto scroll-thin">
                {view === 'projects' && <ProjectsView />}
                {view === 'gallery' && <GalleryView />}
                {view === 'tools' && <ToolsView />}
                {view === 'models' && <ModelsView />}
                {view === 'providers' && <ProvidersView />}
                {view === 'settings' && <SettingsView />}
              </main>
            )}
          </div>
          <HistoryStrip />
        </div>
      </div>
      <StatusFooter />
    </div>
  )
}

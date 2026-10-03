'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AssetRef,
  FallbackEvent,
  GenerationKind,
  GenerationRecord,
  ProviderInfo,
} from './types'
import {
  fetchHistory,
  fetchProviders,
  setProviderPriority,
} from './api-client'

export type ToolId =
  | 'generate'
  | 'fill'
  | 'remove'
  | 'expand'
  | 'background'
  | 'upscale'
  | 'variations'
  | 'text-to-video'
  | 'image-to-video'
  | 'music'
  | 'speech'
  | 'transcribe'
  | 'image-search'
  | 'adjust'

export type ViewId =
  | 'studio'
  | 'projects'
  | 'gallery'
  | 'tools'
  | 'models'
  | 'providers'
  | 'settings'

export const MASK_TOOLS: ToolId[] = ['fill', 'remove', 'expand']

export interface Job {
  id: string
  kind: GenerationKind | 'enhance' | 'local'
  label: string
  prompt?: string
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: number
  endedAt?: number
  providerId?: string
  error?: string
  events?: FallbackEvent[]
  results?: AssetRef[]
  demo?: boolean
  durationMs?: number
}

export interface EditorSignals {
  imageLoaded: boolean
  imageSize: { width: number; height: number } | null
  canUndo: boolean
  canRedo: boolean
  hasMask: boolean
  zoom: number
}

interface FireLabState {
  // navigation
  view: ViewId
  tool: ToolId
  maskActive: boolean
  // project
  projectId: string | null
  projectName: string
  dirty: boolean
  // providers
  providers: ProviderInfo[]
  providersLoading: boolean
  providersError: string | null
  providerMode: string // 'auto' | provider id
  allowDemo: boolean
  // jobs + history
  jobs: Job[]
  history: GenerationRecord[]
  historyLoading: boolean
  // editor signals
  editor: EditorSignals
  brush: { size: number; hardness: number; erase: boolean }
  // prompt state (shared across tools)
  prompt: string
  negativePrompt: string
  styleId: string
  aspect: string
  count: number
  seed: number | null
  preserveUnmasked: boolean
  enhanceMode: 'cinematic' | 'editorial'
  variationsGuidance: string
  backgroundPrompt: string
  backgroundMethod: 'ai' | 'local'
  tolerance: number
  feather: number
  upscaleFactor: 2 | 3
  expandDirection: 'all' | 'h' | 'v'
  expandAmount: number
  // video / music / speech / transcribe / search tool state
  videoSize: string
  videoDurationSec: number
  videoCount: number
  musicDurationSec: number
  musicCount: number
  speechText: string
  speechVoice: string
  speechSpeed: number
  transcribeLanguage: string
  // search tool state (shared so the tools catalog can prefill a query)
  searchQuery: string
  // layout
  rightPanelOpen: boolean
  bottomOpen: boolean
  comparing: boolean

  setView: (view: ViewId) => void
  setTool: (tool: ToolId) => void
  setMaskActive: (active: boolean) => void
  setProject: (id: string | null, name: string, dirty?: boolean) => void
  markDirty: (dirty?: boolean) => void
  setProviderMode: (mode: string) => void
  setAllowDemo: (allow: boolean) => void
  refreshProviders: () => Promise<void>
  reorderProviders: (order: string[]) => Promise<void>
  refreshHistory: (opts?: { limit?: number }) => Promise<void>
  addJob: (job: Job) => void
  patchJob: (id: string, patch: Partial<Job>) => void
  removeJob: (id: string) => void
  setEditorSignals: (signals: Partial<EditorSignals>) => void
  setBrush: (brush: Partial<FireLabState['brush']>) => void
  set: <K extends keyof FireLabState>(key: K, value: FireLabState[K]) => void
}

const initialEditor: EditorSignals = {
  imageLoaded: false,
  imageSize: null,
  canUndo: false,
  canRedo: false,
  hasMask: false,
  zoom: 1,
}

export const useFireLab = create<FireLabState>()(
  persist(
    (set, get) => ({
      view: 'studio',
      tool: 'generate',
      maskActive: false,
      projectId: null,
      projectName: 'Untitled',
      dirty: false,
      providers: [],
      providersLoading: false,
      providersError: null,
      providerMode: 'auto',
      allowDemo: true,
      jobs: [],
      history: [],
      historyLoading: false,
      editor: initialEditor,
      brush: { size: 48, hardness: 80, erase: false },
      prompt: '',
      negativePrompt: '',
      styleId: 'cinematic',
      aspect: '1:1',
      count: 1,
      seed: null,
      preserveUnmasked: true,
      enhanceMode: 'cinematic',
      variationsGuidance: '',
      backgroundPrompt: '',
      backgroundMethod: 'ai',
      tolerance: 38,
      feather: 2,
      upscaleFactor: 2,
      expandDirection: 'all',
      expandAmount: 256,
      videoSize: '1024x576',
      videoDurationSec: 5,
      videoCount: 1,
      musicDurationSec: 20,
      musicCount: 1,
      speechText: '',
      speechVoice: 'tongtong',
      speechSpeed: 1,
      transcribeLanguage: '',
      searchQuery: '',
      rightPanelOpen: true,
      bottomOpen: true,
      comparing: false,

      setView: (view) => set({ view }),
      setTool: (tool) => {
        const s = get()
        const maskActive = MASK_TOOLS.includes(tool) && s.editor.imageLoaded ? true : s.maskActive
        set({ tool, maskActive })
      },
      setMaskActive: (maskActive) => set({ maskActive }),
      setProject: (projectId, projectName, dirty = false) => set({ projectId, projectName, dirty }),
      markDirty: (dirty = true) => set({ dirty }),
      setProviderMode: (providerMode) => set({ providerMode }),
      setAllowDemo: (allowDemo) => set({ allowDemo }),

      refreshProviders: async () => {
        set({ providersLoading: true, providersError: null })
        try {
          const providers = await fetchProviders()
          set({ providers, providersLoading: false })
        } catch (err) {
          set({
            providersLoading: false,
            providersError: err instanceof Error ? err.message : 'Failed to load providers',
          })
        }
      },

      reorderProviders: async (order) => {
        try {
          const providers = await setProviderPriority(order)
          set({ providers })
        } catch {
          // non-fatal
        }
      },

      refreshHistory: async (opts) => {
        set({ historyLoading: true })
        try {
          const history = await fetchHistory({ limit: opts?.limit ?? 80 })
          set({ history, historyLoading: false })
        } catch {
          set({ historyLoading: false })
        }
      },

      addJob: (job) => set((s) => ({ jobs: [job, ...s.jobs].slice(0, 30) })),
      patchJob: (id, patch) =>
        set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
      removeJob: (id) => set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) })),

      setEditorSignals: (signals) => set((s) => ({ editor: { ...s.editor, ...signals } })),
      setBrush: (brush) => set((s) => ({ brush: { ...s.brush, ...brush } })),
      set: (key, value) => set({ [key]: value } as Partial<FireLabState>),
    }),
    {
      name: 'firelab-settings',
      partialize: (s) => ({
        providerMode: s.providerMode,
        allowDemo: s.allowDemo,
        brush: s.brush,
        styleId: s.styleId,
        aspect: s.aspect,
        count: s.count,
        preserveUnmasked: s.preserveUnmasked,
        enhanceMode: s.enhanceMode,
        backgroundMethod: s.backgroundMethod,
        tolerance: s.tolerance,
        feather: s.feather,
        upscaleFactor: s.upscaleFactor,
        expandDirection: s.expandDirection,
        expandAmount: s.expandAmount,
        videoSize: s.videoSize,
        videoDurationSec: s.videoDurationSec,
        musicDurationSec: s.musicDurationSec,
        speechVoice: s.speechVoice,
        speechSpeed: s.speechSpeed,
      }),
    }
  )
)

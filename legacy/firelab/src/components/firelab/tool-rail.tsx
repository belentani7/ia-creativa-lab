'use client'

import {
  Sparkles,
  Brush,
  Eraser,
  Expand,
  Wand2,
  Scaling,
  Shuffle,
  SlidersHorizontal,
  Clapperboard,
  Video,
  Music,
  AudioLines,
  Mic,
  Search,
  FolderOpen,
  Images,
  LayoutGrid,
  Boxes,
  Plug,
  Settings2,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useFireLab, type ToolId, type ViewId } from '@/lib/firelab/store'
import { TOOLS_CATALOG } from '@/lib/firelab/tools-catalog'

interface ToolDef {
  id: ToolId
  label: string
  icon: typeof Sparkles
  hint: string
}

const TOOL_GROUPS: { label: string; tools: ToolDef[] }[] = [
  {
    label: 'IMAGE',
    tools: [
      { id: 'generate', label: 'Generate', icon: Sparkles, hint: 'Text → Image (G)' },
      { id: 'fill', label: 'Fill', icon: Brush, hint: 'Generative Fill — paint a mask (B)' },
      { id: 'remove', label: 'Remove', icon: Eraser, hint: 'Remove Object — paint a mask (B)' },
      { id: 'expand', label: 'Expand', icon: Expand, hint: 'Generative Expand (outpainting)' },
      { id: 'background', label: 'Background', icon: Wand2, hint: 'Remove / replace background' },
      { id: 'variations', label: 'Variations', icon: Shuffle, hint: 'Image variations' },
      { id: 'upscale', label: 'Upscale', icon: Scaling, hint: 'Upscale & refine' },
      { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal, hint: 'Local pixel ops — flip, rotate, grade (A)' },
    ],
  },
  {
    label: 'VIDEO',
    tools: [
      { id: 'text-to-video', label: 'Text → Video', icon: Clapperboard, hint: 'Describe a shot — the engine animates it (V)' },
      { id: 'image-to-video', label: 'Image → Video', icon: Video, hint: 'Animate the canvas image as the start frame' },
    ],
  },
  {
    label: 'AUDIO',
    tools: [{ id: 'music', label: 'Music', icon: Music, hint: 'Text → Music — procedural synth' }],
  },
  {
    label: 'VOICE',
    tools: [
      { id: 'speech', label: 'Speech', icon: AudioLines, hint: 'Text → Speech — 7 voices' },
      { id: 'transcribe', label: 'Transcribe', icon: Mic, hint: 'Speech → Text from an audio file' },
    ],
  },
  {
    label: 'REFERENCE',
    tools: [{ id: 'image-search', label: 'Image Search', icon: Search, hint: 'Find reference images on the web' }],
  },
]

const VIEWS: { id: ViewId; label: string; icon: typeof Sparkles; badge?: string }[] = [
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'gallery', label: 'Gallery', icon: Images },
  { id: 'tools', label: 'Tools', icon: LayoutGrid, badge: String(TOOLS_CATALOG.length) },
  { id: 'models', label: 'Models', icon: Boxes },
  { id: 'providers', label: 'Providers', icon: Plug },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

export function ToolRail() {
  const tool = useFireLab((s) => s.tool)
  const view = useFireLab((s) => s.view)
  const setTool = useFireLab((s) => s.setTool)
  const setView = useFireLab((s) => s.setView)

  return (
    <TooltipProvider delayDuration={250}>
      <nav
        aria-label="FireLab tools"
        className="flex w-14 shrink-0 flex-col items-stretch border-r bg-card/40"
      >
        <div className="scroll-thin flex flex-col items-center gap-0.5 overflow-y-auto py-2">
          {TOOL_GROUPS.map((group, gi) => (
            <div key={group.label} className="flex w-full flex-col items-center gap-0.5">
              {gi > 0 && <Separator className="my-1.5 w-8 bg-border/70" />}
              <span
                className="w-full select-none py-0.5 text-center text-[8px] font-semibold uppercase tracking-[0.04em] text-muted-foreground/50"
                aria-hidden="true"
              >
                {group.label}
              </span>
              {group.tools.map((t) => {
                const active = view === 'studio' && tool === t.id
                return (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={t.label}
                        aria-pressed={active}
                        onClick={() => {
                          setTool(t.id)
                          setView('studio')
                        }}
                        className={`focus-ember group relative flex h-11 w-11 items-center justify-center rounded-md transition-colors ${
                          active
                            ? 'bg-accent text-ember tool-active'
                            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        <t.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-xs">
                      <span className="font-medium">{t.label}</span>
                      <span className="block text-muted-foreground">{t.hint}</span>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto flex shrink-0 flex-col items-center gap-0.5 border-t py-2">
          {VIEWS.map((v) => {
            const active = view === v.id
            return (
              <Tooltip key={v.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={v.badge ? `${v.label} — ${v.badge} recipes` : v.label}
                    aria-pressed={active}
                    onClick={() => setView(v.id)}
                    className={`focus-ember relative flex h-11 w-11 items-center justify-center rounded-md transition-colors ${
                      active
                        ? 'bg-accent text-foreground'
                        : 'text-muted-foreground/80 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <v.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                    {v.badge && (
                      <span
                        className="absolute right-0.5 top-0.5 rounded-full bg-ember px-1 text-[8px] font-bold leading-[13px] text-background"
                        aria-hidden="true"
                      >
                        {v.badge}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {v.label}
                  {v.badge && <span className="block text-muted-foreground">{v.badge} recipes</span>}
                </TooltipContent>
              </Tooltip>
            )
          })}
          <span className="micro-label rotate-180 [writing-mode:vertical-rl] select-none pb-1 pt-2 text-muted-foreground/40">
            FIRELAB
          </span>
        </div>
      </nav>
    </TooltipProvider>
  )
}

'use client'

import { useFireLab } from '@/lib/firelab/store'
import { GeneratePanel } from './panels/generate-panel'
import { EditPanel } from './panels/edit-panel'
import { ExpandPanel } from './panels/expand-panel'
import { BackgroundPanel } from './panels/background-panel'
import { UpscalePanel } from './panels/upscale-panel'
import { VariationsPanel } from './panels/variations-panel'
import { VideoPanel } from './panels/video-panel'
import { MusicPanel } from './panels/music-panel'
import { SpeechPanel } from './panels/speech-panel'
import { TranscribePanel } from './panels/transcribe-panel'
import { SearchPanel } from './panels/search-panel'
import { AdjustPanel } from './panels/adjust-panel'

const TOOL_META: Record<string, { title: string; blurb: string }> = {
  generate: {
    title: 'Generate',
    blurb: 'Text → Image with the built-in engine or any configured provider.',
  },
  fill: {
    title: 'Generative Fill',
    blurb: 'Paint a mask, describe what should appear, let AI blend it in.',
  },
  remove: {
    title: 'Remove Object',
    blurb: 'Mask an object and reconstruct the background behind it.',
  },
  expand: {
    title: 'Generative Expand',
    blurb: 'Grow the canvas and let the model continue the scene (outpainting).',
  },
  background: {
    title: 'Background',
    blurb: 'Remove or replace the background. Export transparent PNGs.',
  },
  upscale: {
    title: 'Upscale',
    blurb: 'Local resampling + sharpen, or an AI refinement pass.',
  },
  variations: {
    title: 'Variations',
    blurb: 'Explore reinterpretations of the current image.',
  },
  'text-to-video': {
    title: 'Text → Video',
    blurb: 'Describe a shot — the built-in engine (cogvideox-3) animates it.',
  },
  'image-to-video': {
    title: 'Image → Video',
    blurb: 'Animate the current canvas image as the start frame.',
  },
  music: {
    title: 'Music',
    blurb: 'Text → music: procedural synth, or musicgen with a key.',
  },
  speech: {
    title: 'Speech',
    blurb: 'Narrate any text with the built-in voice engine (7 voices).',
  },
  transcribe: {
    title: 'Transcribe',
    blurb: 'Speech → text from an audio file — send it straight to a prompt.',
  },
  'image-search': {
    title: 'Image Search',
    blurb: 'Find reference images on the web, then drop them on the canvas.',
  },
  adjust: {
    title: 'Adjust',
    blurb: 'Local pixel ops — flip, rotate, grade, vignette. No AI, instant.',
  },
}

export function RightPanel() {
  const tool = useFireLab((s) => s.tool)
  const open = useFireLab((s) => s.rightPanelOpen)
  const meta = TOOL_META[tool] ?? TOOL_META.generate

  return (
    <aside
      aria-label="Tool parameters"
      className={`${
        open ? 'flex' : 'hidden'
      } absolute inset-y-0 right-0 z-20 w-full flex-col border-l bg-background/95 backdrop-blur-sm sm:w-[340px] lg:static lg:z-0 lg:w-[340px] lg:bg-card/40 lg:backdrop-blur-none`}
    >
      <div className="border-b px-4 pt-4 pb-3">
        <p className="micro-label">Parameters</p>
        <h2 className="font-display mt-0.5 text-xl italic leading-tight text-foreground">{meta.title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{meta.blurb}</p>
      </div>
      <div className="scroll-thin flex-1 overflow-y-auto p-4">
        {tool === 'generate' && <GeneratePanel />}
        {(tool === 'fill' || tool === 'remove') && <EditPanel mode={tool} />}
        {tool === 'expand' && <ExpandPanel />}
        {tool === 'background' && <BackgroundPanel />}
        {tool === 'upscale' && <UpscalePanel />}
        {tool === 'variations' && <VariationsPanel />}
        {tool === 'text-to-video' && <VideoPanel variant="text-to-video" />}
        {tool === 'image-to-video' && <VideoPanel variant="image-to-video" />}
        {tool === 'music' && <MusicPanel />}
        {tool === 'speech' && <SpeechPanel />}
        {tool === 'transcribe' && <TranscribePanel />}
        {tool === 'image-search' && <SearchPanel />}
        {tool === 'adjust' && <AdjustPanel />}
      </div>
    </aside>
  )
}

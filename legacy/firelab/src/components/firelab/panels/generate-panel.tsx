'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Loader2, Sparkles, Trash2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFireLab } from '@/lib/firelab/store'
import { getEngine } from '@/lib/firelab/editor/engine'
import { useRunJob, cancelJob, toJobResult } from '@/lib/firelab/jobs'
import { generateImage, enhancePrompt, assetToDataUrl } from '@/lib/firelab/api-client'
import { ProviderSelect, resolveAutoProvider } from '../provider-select'
import {
  ASPECT_PRESETS,
  BUILTIN_SUPPORTED_SIZES,
  type Capability,
} from '@/lib/firelab/types'
import {
  PROMPT_SEGMENT_FIELDS,
  assemblePrompt,
  STYLE_PRESETS,
  type PromptSegments,
} from '@/lib/firelab/prompt'

const EMPTY_SEGMENTS: PromptSegments = {
  subject: '',
  environment: '',
  lighting: '',
  camera: '',
  lens: '',
  composition: '',
  aesthetic: '',
  color: '',
  mood: '',
  extras: '',
}

export function GeneratePanel() {
  const prompt = useFireLab((s) => s.prompt)
  const negativePrompt = useFireLab((s) => s.negativePrompt)
  const styleId = useFireLab((s) => s.styleId)
  const aspect = useFireLab((s) => s.aspect)
  const count = useFireLab((s) => s.count)
  const seed = useFireLab((s) => s.seed)
  const providers = useFireLab((s) => s.providers)
  const providerMode = useFireLab((s) => s.providerMode)
  const projectId = useFireLab((s) => s.projectId)
  const allowDemo = useFireLab((s) => s.allowDemo)
  const enhanceMode = useFireLab((s) => s.enhanceMode)
  const set = useFireLab((s) => s.set)

  const { runJob } = useRunJob()
  const [running, setRunning] = useState(false)
  const [enhancing, setEnhancing] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [segments, setSegments] = useState<PromptSegments>(EMPTY_SEGMENTS)

  const activeProvider =
    providerMode === 'auto'
      ? resolveAutoProvider(providers, 'textToImage')
      : providers.find((p) => p.id === providerMode) ?? null
  const showNegative = !!activeProvider?.capabilities.negativePrompt
  const showSeed = !!activeProvider?.capabilities.seed
  const preset = ASPECT_PRESETS.find((a) => a.id === aspect) ?? ASPECT_PRESETS[0]
  const size = activeProvider?.id === 'builtin' || !activeProvider
    ? preset.size
    : BUILTIN_SUPPORTED_SIZES.includes(preset.size as (typeof BUILTIN_SUPPORTED_SIZES)[number])
      ? preset.size
      : '1024x1024'
  const [w, h] = size.split('x').map(Number)

  const onEnhance = async () => {
    if (!prompt.trim()) {
      toast.error('Write a few words first', { description: 'The enhancer rewrites your idea into a rich prompt.' })
      return
    }
    setEnhancing(true)
    try {
      const res = await enhancePrompt({ prompt, mode: enhanceMode })
      set('prompt', res.enhanced)
      toast.success('Prompt enhanced', {
        description: `via ${res.providerId} · ${res.durationMs} ms — original kept in undo (Ctrl+Z).`,
      })
    } catch (err) {
      toast.error('Prompt enhancement failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setEnhancing(false)
    }
  }

  // ——— external Enhance trigger (Tools catalog → 'firelab:enhance-prompt') ———
  // No dep array: re-subscribes every render so the listener always closes over
  // the latest prompt/enhance state — same code path as the Enhance button.
  useEffect(() => {
    const onEnhanceEvent = () => void onEnhance()
    window.addEventListener('firelab:enhance-prompt', onEnhanceEvent)
    return () => window.removeEventListener('firelab:enhance-prompt', onEnhanceEvent)
  })

  const onGenerate = async () => {
    if (!prompt.trim() || running) return
    const id = crypto.randomUUID()
    setJobId(id)
    setRunning(true)
    try {
      await runJob({
        id,
        kind: 'text-to-image',
        label: prompt.slice(0, 60),
        fn: async (signal) =>
          toJobResult(
            await generateImage(
              {
                providerId: providerMode,
                prompt,
                negativePrompt: showNegative ? negativePrompt : undefined,
                size,
                count,
                style: styleId,
                seed: showSeed ? (seed ?? undefined) : undefined,
                projectId,
                allowDemo,
              },
              signal
            )
          ),
        onDone: async (res) => {
          if (res.demo) {
            toast.warning('DEMO RESULT', {
              description: 'All real providers failed — this is a labeled deterministic placeholder, not AI.',
            })
          } else {
            toast.success(`${res.results.length} image${res.results.length > 1 ? 's' : ''} generated`, {
              description: `${res.providerId} · ${(res.durationMs / 1000).toFixed(1)}s · click a thumbnail below to open it.`,
            })
          }
          // auto-apply the first result when the canvas is empty
          const engine = getEngine()
          if (!engine.hasImage() && res.results[0]) {
            try {
              const dataUrl = await assetToDataUrl(res.results[0].url)
              await engine.loadImageFromDataUrl(dataUrl)
            } catch {
              // user can still apply manually
            }
          }
        },
      })
    } catch (err) {
      toast.error('Generation failed', {
        description: err instanceof Error ? err.message : 'All providers failed — see History for details.',
      })
    } finally {
      setRunning(false)
      setJobId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* prompt */}
      <section className="space-y-2" aria-label="Prompt">
        <div className="flex items-center justify-between">
          <Label htmlFor="fl-prompt" className="micro-label">Prompt</Label>
          <span className="text-[11px] text-muted-foreground">{prompt.trim().length} chars</span>
        </div>
        <Textarea
          id="fl-prompt"
          value={prompt}
          onChange={(e) => set('prompt', e.target.value)}
          placeholder="A surreal cinematic portrait — describe subject, light, mood…"
          className="min-h-28 resize-none border-border bg-secondary/30 text-sm leading-relaxed"
        />
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => void onEnhance()}
            disabled={enhancing || !prompt.trim()}
            title="Rewrite the prompt with an LLM (cinematic/editorial language)"
          >
            {enhancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 text-ember" />}
            Enhance
          </Button>
          <Select value={enhanceMode} onValueChange={(v) => set('enhanceMode', v as 'cinematic' | 'editorial')}>
            <SelectTrigger className="h-8 w-28 border-border text-xs" aria-label="Enhance style">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="editorial">Editorial</SelectItem>
            </SelectContent>
          </Select>
          {prompt && (
            <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={() => set('prompt', '')} aria-label="Clear prompt">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </section>

      {/* prompt builder */}
      <Collapsible open={builderOpen} onOpenChange={setBuilderOpen}>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Prompt Builder</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${builderOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2.5 pt-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Build the prompt piece by piece — segments are composed into one comma-separated directive.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PROMPT_SEGMENT_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`seg-${f.key}`} className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </Label>
                <Input
                  id={`seg-${f.key}`}
                  value={segments[f.key]}
                  onChange={(e) => setSegments({ ...segments, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="h-8 border-border bg-secondary/30 text-xs"
                />
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={() => {
              const composed = assemblePrompt(segments, prompt)
              if (!composed.trim()) return
              set('prompt', composed)
              toast.success('Prompt composed', { description: 'Segments merged into the main prompt.' })
            }}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-ember" /> Compose prompt
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* style presets */}
      <section className="space-y-2" aria-label="Style">
        <span className="micro-label">Style</span>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => set('styleId', s.id)}
              className={`focus-ember rounded-full border px-2.5 py-1 text-[11px] transition ${
                styleId === s.id
                  ? 'border-ember/70 bg-accent text-foreground'
                  : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
              }`}
              title={s.suffix || 'No style modifiers'}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* aspect + size */}
      <section className="space-y-2" aria-label="Aspect ratio">
        <span className="micro-label">Aspect ratio</span>
        <ToggleGroup
          type="single"
          value={aspect}
          onValueChange={(v) => v && set('aspect', v)}
          className="flex flex-wrap justify-start gap-1.5"
        >
          {ASPECT_PRESETS.map((a) => (
            <ToggleGroupItem
              key={a.id}
              value={a.id}
              className="h-7 px-2.5 text-[11px] data-[state=on]:bg-accent data-[state=on]:text-ember"
            >
              {a.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="font-mono text-[11px] text-muted-foreground">
          output {w} × {h} px · engine sizes up to 1440 × 720
        </p>
      </section>

      {/* count */}
      <section className="space-y-2" aria-label="Image count">
        <span className="micro-label">Images</span>
        <ToggleGroup
          type="single"
          value={String(count)}
          onValueChange={(v) => v && set('count', Number(v))}
          className="gap-1.5"
        >
          {[1, 2, 3, 4].map((n) => (
            <ToggleGroupItem
              key={n}
              value={String(n)}
              className="h-7 w-9 text-xs data-[state=on]:bg-accent data-[state=on]:text-ember"
            >
              {n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      {/* advanced */}
      <Collapsible>
        <CollapsibleTrigger className="focus-ember flex w-full items-center justify-between rounded-md px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground">
          <span className="micro-label">Advanced</span>
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <ProviderSelect
            capability={'textToImage' as Capability}
            value={providerMode}
            onChange={(v) => set('providerMode', v)}
            includeDemo
          />
          {showNegative && (
            <div className="space-y-1.5">
              <Label htmlFor="fl-negative" className="micro-label">Negative prompt</Label>
              <Textarea
                id="fl-negative"
                value={negativePrompt}
                onChange={(e) => set('negativePrompt', e.target.value)}
                placeholder="what to avoid — blurry, text, extra limbs…"
                className="min-h-16 resize-none border-border bg-secondary/30 text-xs"
              />
            </div>
          )}
          {showSeed && (
            <div className="space-y-1.5">
              <Label htmlFor="fl-seed" className="micro-label">Seed (optional)</Label>
              <Input
                id="fl-seed"
                type="number"
                value={seed ?? ''}
                onChange={(e) => set('seed', e.target.value ? Number(e.target.value) : null)}
                placeholder="random"
                className="h-8 border-border bg-secondary/30 text-xs"
              />
            </div>
          )}
          {!showNegative && !showSeed && activeProvider && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {activeProvider.name} takes prompt + size only — negative prompt and seed controls are hidden
              because the engine has no native parameters for them.
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* cost note */}
      <p className="rounded-md border bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        {activeProvider?.id === 'builtin' || !activeProvider ? (
          <>
            <span className="text-foreground/90">Built-in engine — included.</span> No API key, no quota.
            Cloud providers activate automatically only when you configure them.
          </>
        ) : (
          activeProvider.note ?? activeProvider.description
        )}
      </p>

      {/* run */}
      <div className="space-y-2">
        <Button
          onClick={() => void onGenerate()}
          disabled={running || !prompt.trim()}
          className="h-11 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground transition hover:bg-ember-strong disabled:opacity-40"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generate
            </>
          )}
        </Button>
        {running && jobId && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs text-muted-foreground"
            onClick={() => cancelJob(jobId)}
          >
            Cancel (stops waiting — the server may still finish)
          </Button>
        )}
      </div>
    </div>
  )
}

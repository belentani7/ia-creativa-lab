# Architecture

## Principles

```
CLOUD IS OPTIONAL. LOCAL IS FIRST. PROVIDERS ARE PLUGINS.
THE UI NEVER DEPENDS ON ONE AI COMPANY.
```

Everything below exists to enforce those four sentences.

## High-level map

```
┌───────────────────── Browser (client) ─────────────────────┐
│  FireLabApp (shell) · keyboard shortcuts · theme            │
│  ├─ Viewport ── FireLabEngine (canvas: image/original/mask, │
│  │              zoom·pan, brush stamps, undo/redo snapshots)│
│  ├─ RightPanel ── tool panels (capability-driven controls)  │
│  ├─ HistoryStrip ── job queue + results + errors            │
│  └─ Views ── Projects · Gallery · Models · Providers · Set.  │
│  State: Zustand store (persisted prefs) · api-client (typed)│
└──────────────────────────┬──────────────────────────────────┘
                           │ REST (fetch, relative URLs)
┌──────────────────────────┴──────────────────────────────────┐
│  Next.js route handlers  /api/firelab/*                     │
│  ├─ ProviderManager ── registry · priority · fallback       │
│  │   └─ Adapters: builtin · qwen · nvidia · hf · ollama ·   │
│  │                 comfyui · demo                            │
│  ├─ Prompt engine ── style presets · edit instruction       │
│  │                 templates · enhance system prompts        │
│  ├─ Storage ── assets on disk + WebP thumbs (sharp)         │
│  └─ Prisma/SQLite ── Project · Generation · Asset           │
└──────────────────────────────────────────────────────────────┘
```

## The provider contract

`src/lib/firelab/providers/types.ts`:

```ts
interface ProviderAdapter {
  id: string
  kind: 'builtin' | 'local' | 'cloud' | 'demo'
  isConfigured(): Promise<boolean>          // cheap env/probe check
  capabilities(): Partial<Record<Capability, boolean>>
  testConnection(): Promise<DiagnosticCheck[]>   // readable, secret-free
  generateImages?(req): Promise<GeneratedImage[]>
  editImage?(req): Promise<GeneratedImage[]>
  enhancePrompt?(req): Promise<string>
  listModels?(): Promise<ProviderModelInfo[]>
}
```

- Adapters **declare only what they truly support**. The UI reads capabilities and hides controls the active engine can't honor (e.g. the built-in engine exposes no seed/negative-prompt parameters, so those inputs disappear when it is active).
- `runWithFallback` walks the ordered, configured, capability-matching providers; each failure is classified (auth / rate-limit / quota / timeout / network / response) into a human message and recorded in the job's event chain.
- The **demo engine is a labeled last resort** — deterministic SVG art watermarked `DEMO RESULT`, only reached when everything real has failed (and only if the user allows it in Settings).

Priority order persists in `db/firelab-config.json` (gitignored). The UI reorders it via `POST /api/firelab/providers/priority`.

## The mask pipeline (why magenta?)

The built-in engine's edit endpoint accepts **image + instruction** — no mask channel. Rather than fake inpainting, FireLab uses an explicit, documented pipeline:

1. The user paints an alpha mask in the browser (brush with size/hardness).
2. `compositeForEdit()` fills the masked region with solid magenta `#FF00FF`.
3. The instruction template explicitly bounds the edit to "the region covered by the solid magenta overlay" and demands everything else stays unchanged.
4. When the result returns, `applyResult({ preserveUnmasked: true })` re-composites **the original pixels** outside the mask over the result with a feathered seam — the unmasked area is pixel-identical, guaranteed locally.

Expand (outpainting) uses the same idea: the canvas grows locally, the new border is marked magenta, and the model is told to continue the scene into it.

## Background removal (AI + local keying)

1. AI pass: the model places the subject on a flat chroma-green backdrop (explicitly instructed, subject unchanged).
2. Local pass: `chromaKey()` in the browser computes greenness alpha with spill removal, then feather (separable box blur) produces the final transparency.
3. Everything after the AI pass is deterministic and re-tunable live (tolerance/feather sliders re-key without new API calls).

There is also a **fully local mode** (border-color keying) with no AI at all — approximate, instant, honest.

## Editor engine

`src/lib/firelab/editor/engine.ts` is a client singleton owning:

- `image` / `original` (before/after) / `mask` canvases (lazy — SSR safe)
- viewport transform (`zoomAt` anchored at cursor), pointer capture, wheel zoom
- brush stamps (radial gradient for hardness < 96, `destination-out` for erase)
- snapshot history (14 entries; only the changed canvas is re-encoded per push)
- `pushHistory` granularity: image edits, mask strokes, ops (invert/fill/clear/expand/upscale)

React never re-renders on pointer moves — the engine paints directly and notifies via a signals callback that updates only lightweight Zustand fields (zoom, canUndo, hasMask…).

## Data model

```
Project    id · name · canvas(JSON: imageAssetId, maskAssetId, size, prompt, tool, savedAt)
Generation id · projectId? · kind · prompt? · provider · params(JSON incl. asset refs)
           · status · error? · durationMs? · createdAt
Asset      id · file · thumb? · mime · bytes · width · height · createdAt
```

Assets live in `db/firelab-assets/` (gitignored), are served by `/api/firelab/assets/[id]` with immutable caching, and thumbnails are 320px WebP generated with sharp.

## Extension points

- **New cloud/local provider** → new adapter file + registration (see CONTRIBUTING).
- **In-browser WebGPU runtime** → implement the same adapter contract client-side; the UI layer already consumes capabilities abstractly. This is the roadmap path to "local = no server at all".
- **New tool** → store `ToolId` + panel component using `useRunJob()` (queue/cancel/history stay uniform).

## Security model

- Provider keys are read in route handlers via `process.env` only; `.env*` is gitignored; diagnostics never echo secrets.
- Image uploads are size-capped (~10 MB) and data-URL validated.
- All AI SDK usage stays on the server (`z-ai-web-dev-sdk` is never imported client-side).
- The repository ships `.env.example` with empty placeholders only.

# BELENTANI // FIRELAB

**Local-first generative creative studio.** A modular, open web application for AI image creation and editing — inspired by the *capabilities* of tools like Adobe Firefly, built so that **no single AI company can ever break it**.

> **CLOUD IS OPTIONAL. LOCAL IS FIRST. PROVIDERS ARE PLUGINS. THE UI NEVER DEPENDS ON ONE AI COMPANY.**

---

## What is this?

FireLab is a creative studio that runs as a web app with:

- a **real canvas editor** (zoom, pan, brush masks with size/hardness, undo/redo, before/after compare, local pixel ops, export)
- a **provider manager** that treats every AI engine as an interchangeable plugin with detected capabilities, priorities, diagnostics and **automatic fallback** — currently **29 connections** (2 built-in engines, 11 local runtimes, 16 cloud — of which Pollinations is keyless)
- a **built-in engine** that works with zero configuration and zero API keys — text-to-image, editing, prompt enhancement, **video** (text and image-to-video), **speech synthesis and transcription**, **image search** and **procedural music**
- a **110-tool catalog** — a recipe book over real capabilities: every entry opens a native panel, prefills a production-grade prompt template when it has one, and shows availability resolved live from your configured connections
- optional adapters for cloud and local runtimes — each one activates only when you configure it, and the app keeps working when quotas die, rate limits hit or endpoints change

If every real provider fails, FireLab falls back to a **clearly-labeled deterministic demo engine** — never a fake "AI is generating…" spinner, never a silent placeholder pretending to be intelligence.

### Tools

| Tool | What it does | Works without any API key? |
|---|---|---|
| **Generate** | Text → Image with style presets, aspect ratios, prompt builder, LLM prompt enhancement | ✅ built-in engine |
| **Generative Fill** | Paint a mask, describe the content, AI blends it in; unmasked pixels can stay pixel-identical | ✅ built-in engine |
| **Remove Object** | Mask an object, reconstruct the background | ✅ built-in engine |
| **Generative Expand** | Grow the canvas, model continues the scene (outpainting) | ✅ built-in engine |
| **Background** | AI chroma-green pipeline + local keying → transparent PNG; or a fully local approximate key | ✅ both modes |
| **Upscale** | Local stepwise resample + unsharp mask (free, deterministic) or an AI refinement pass | ✅ local mode |
| **Variations** | Reinterpretations of the current image (also the image → image surface for style transfer and remix recipes) | ✅ built-in engine |
| **Text → Video** | Describe a shot — cogvideox-3 in the built-in engine; fal / Replicate / Hugging Face activate with a key; demo GIF fallback | ✅ built-in engine (long jobs) |
| **Image → Video** | Animate the canvas image as the start frame | ✅ built-in engine |
| **Music** | Text → music — built-in procedural synth (honestly labeled, not a neural model) or Replicate musicgen with a key | ✅ procedural synth |
| **Speech** | Text → speech with 7 voices and a speed control | ✅ built-in engine |
| **Transcribe** | Speech → text from an audio file — then fire the transcript straight into a prompt | ✅ built-in engine |
| **Image Search** | Web reference lookup with captions; server-side downloads become canvas assets | ✅ built-in engine |
| **Adjust** | Local pixel ops — crop to aspect, flip, rotate, grades, brightness/contrast, vignette, sharpen | ✅ fully local |
| **Tools catalog** | 110 recipes (42 image · 20 video · 14 audio · 8 voice · 12 text · 4 reference · 10 utility) with live availability | ✅ |
| **Projects** | Canvas image + mask + prompt snapshots in local SQLite | ✅ |
| **Gallery / History** | Every generation recorded — prompt, provider, timing, errors, results; video and audio play inline | ✅ |
| **Models** | Live model catalog across all reachable runtimes | ✅ |
| **Providers** | 29-connection registry: kind filters, search, status, capabilities, models, env vars, test connection diagnostics, priority reordering | ✅ |

### The provider architecture

```
                        BELENTANI FIRELAB
                               │
                    ┌──────────┴──────────┐
                    │                     │
              BUILT-IN ENGINES        29 CONNECTIONS
                    │                     │
              ┌─────┴─────┐     ┌────────┬┴───────────────┬─────────────┐
              │           │     │        │                │             │
         Belentan Core  demo  LOCAL RUNTIMES      KEYLESS CLOUD     KEYED CLOUD
           (always)   (labeled) A1111 · ComfyUI ·     Pollinations   Qwen · NVIDIA · Gemini · fal ·
                               Ollama · whisper.cpp                 Replicate · Together · Cloudflare ·
                               LM Studio · llama.cpp                Stability · DeepInfra · HF · Groq ·
                               Jan · KoboldCpp · vLLM               Mistral · DeepSeek · Cerebras ·
                               LocalAI · text-gen-webui              OpenRouter
                    │                     │
                    └────────┬────────────┘
                             │
                       PROVIDER MANAGER
             capabilities · priority · fallback
                             ↓
                       SAME UI, ALWAYS
```

Every provider declares **real** capabilities (e.g. "Qwen: text-to-image + negative prompt, no inpainting") and the UI adapts: controls the active provider doesn't support are hidden, and operations it can't do show *"This provider does not support X"* with alternatives — never a broken button. The **Tools catalog** resolves each recipe's availability against this same capability data, so the catalog can never advertise something no connection can run.

---

## Quickstart

```bash
# 1. install
bun install        # or npm install / pnpm install

# 2. initialize the local database (SQLite, zero external services)
bun run db:push

# 3. run
bun run dev        # http://localhost:3000
```

That's it. **No API key required** — the built-in engine, editor, masks, projects, gallery, tools catalog and local tools all work immediately. Pollinations even gives you a **keyless cloud fallback** for image generation and prompt enhancement.

### Optional: activate cloud providers

```bash
cp .env.example .env.local
# edit .env.local — only the keys you actually have
```

16 cloud connections are one key away: Qwen/DashScope, NVIDIA NIM, Gemini, Together, Cloudflare Workers AI, Stability, DeepInfra, Hugging Face, fal, Replicate, Groq, Mistral, DeepSeek, Cerebras and OpenRouter — plus keyless Pollinations, which needs nothing at all. Keys are read **server-side only** (API routes). They are never sent to the browser, never committed (`.env*` is gitignored), never logged. See `docs/providers.md` for each provider's setup and verified endpoints.

### Optional: connect local runtimes

11 local servers are auto-detected when running — no keys, no cloud:

- **ComfyUI** (port 8188) — checkpoints listed live, txt2img workflows
- **A1111 / Forge / SD.Next** — full `sdapi/v1` including real mask inpainting, img2img and upscale
- **Ollama** — chat for prompt enhancement, experimental image generation with `x/z-image-turbo`
- **whisper.cpp server** — speech-to-text
- **LM Studio** (1234), **llama.cpp server** (8080), **Jan** (1337), **KoboldCpp** (5001), **vLLM** (8000), **LocalAI** (8080), **text-gen-webui** (5000) — OpenAI-compatible prompt enhancement

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| UI | Tailwind CSS 4, shadcn/ui, Lucide, sonner, Fraunces + Geist |
| State | Zustand (persisted settings) |
| Data | Prisma + SQLite (projects, generations, asset index) |
| Assets | Local filesystem (`db/firelab-assets/`) with WebP thumbnails (sharp) |
| AI | Provider adapter architecture — `z-ai-web-dev-sdk` built-in engine + optional cloud/local adapters |
| Image math | Canvas 2D + typed-array pixel ops (chroma key, unsharp, resample) in the browser |

## Repository structure

```
prisma/schema.prisma            Project · Generation · Asset
src/app/page.tsx                single-page studio (the only route)
src/app/manifest.ts             PWA manifest
src/app/api/firelab/            REST API (no server actions)
  providers/  test/  priority/  provider registry & diagnostics
  generate/   edit/   enhance/  AI operations via the manager
  projects/   history/ assets/  persistence
src/lib/firelab/
  types.ts  prompt.ts           shared contracts + prompt engine
  tools-catalog.ts              110-tool recipe book (pure data)
  store.ts  api-client.ts  jobs.ts
  editor/engine.ts              canvas engine (zoom/pan/brush/history)
  imageops.ts                   chroma key · sharpen · resample · crop
  records.ts  storage.ts
  providers/                    AIProvider adapters + manager
    builtin.ts demo.ts pollinations.ts a1111.ts openai-local.ts
    cloud-llm.ts together.ts deepinfra.ts cloudflare.ts gemini.ts
    stability.ts fal.ts replicate.ts whispercpp.ts ollama.ts
    comfyui.ts qwen.ts nvidia.ts huggingface.ts
src/components/firelab/         studio UI (panels, views, viewport)
  views/tools-view.tsx          the catalog view
  views/providers-view.tsx      29-connection registry view
  panels/                       tool panels for all 14 tools incl.
                                video / music / speech / transcribe /
                                search / adjust
docs/                           architecture · providers · deployment · troubleshooting
```

## Scripts

```bash
bun run dev        # dev server (port 3000)
bun run lint       # ESLint
bun run db:push    # apply the Prisma schema to SQLite
bun run build      # production build
bun run start      # run the production build
```

## Environment variables

See [`.env.example`](./.env.example) — every variable is optional except `DATABASE_URL` (defaults to a local SQLite file). Providers without keys simply stay inactive; the app never nags you with "API KEY REQUIRED" walls.

## What works offline / without keys

- ✅ All editor features (masks, brush, undo, compare, adjust/crop/grade ops, export)
- ✅ Built-in engine generation & editing (inside this runtime) — images **and** video, music, speech, transcription, image search
- ✅ Local background keying, local upscaling, all ten Adjust utilities
- ✅ Projects, gallery, tools catalog, provider manager, diagnostics
- 🔌 Keyless cloud fallback (Pollinations) — no key, still real generation
- 🔌 15 keyed cloud + 11 local runtimes: only when configured / running
- 📋 Roadmap: in-browser WebGPU/ONNX diffusion so "local" means *no server at all* — the adapter slot already exists

## Honesty rules baked into the product

1. **No fake generation.** Nothing pretends to be AI. The demo engine is watermarked `DEMO RESULT`.
2. **No invented endpoints.** Cloud adapters were built from verified documentation (see `docs/providers.md` with sources); anything unverified is marked in the UI and docs.
3. **No invisible failures.** Every generation records provider, timing, fallback chain and readable errors ("NVIDIA responded with rate limit (429). Falling back.").
4. **No secret leakage.** Keys live in `.env.local` server-side. `Test connection` diagnostics never print secrets.
5. **No fake catalog entries.** The 110-tool catalog maps every recipe to a real panel; availability chips are computed from live provider capability data — a recipe that nothing can run yet says *"needs provider"* and tells you which connection would unlock it.

## Limitations (documented, not hidden)

- The built-in engine's edit API takes **image + instruction** (no raw mask channel). FireLab therefore sends masks as a solid magenta region marker with an explicit instruction, and can re-composite unmasked pixels pixel-perfectly afterwards. This is a real, working pipeline — not native mask-channel inpainting (A1111 connections get true mask inpainting).
- Built-in music is a **procedural synthesizer** — rule-based local synthesis, labeled as such in the UI; Replicate's musicgen joins with a key.
- Video generation is slow (15–180 s for cogvideox-3) and text rendering inside video models is unreliable — the catalog marks kinetic-typography recipes experimental for exactly this reason.
- NVIDIA's free tier moved from credits to rate limits (per NVIDIA forums, Sep 2025) — the adapter handles 402/429 gracefully rather than assuming a fixed quota.
- Ollama image generation is experimental (macOS first, Jan 2026) — capabilities are advertised honestly and failures are actionable.
- In-browser (WebGPU) model execution is architecture-ready but not yet implemented; current "local" means *your machine's server*, which already includes zero-key operation.

## License

MIT — see [`LICENSE`](./LICENSE). This is an independent project; it is **not affiliated with, endorsed by, or connected to Adobe**, and contains no Adobe assets or trademarks. Inspiration is functional, not visual or legal.

---

**BELENTANI** // FIRELAB — *fire is optional. the lab is yours.*

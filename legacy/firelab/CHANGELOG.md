# Changelog

All notable changes to BELENTANI FIRELAB are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] — 2026-09-06

### Added
- **29 provider connections** (up from 7) — 2 built-in engines (Belentan Core + labeled demo), 11 local runtimes (A1111/Forge/SD.Next, ComfyUI, Ollama, whisper.cpp, LM Studio, llama.cpp, Jan, KoboldCpp, vLLM, LocalAI, text-gen-webui) and 16 cloud connections, of which **Pollinations is keyless** — real generation with zero API keys. 15 keyed clouds (Qwen/DashScope, NVIDIA NIM, Gemini, Together, Cloudflare Workers AI, Stability, DeepInfra, Hugging Face, fal, Replicate, Groq, Mistral, DeepSeek, Cerebras, OpenRouter) activate only when configured; the demo engine stays the labeled last resort. New API routes: `video`, `music`, `speech`, `transcribe`, `image-search`.
- **Video** — text-to-video and image-to-video (animate the canvas as the start frame) via the built-in engine's cogvideox-3 (verified live, 15–180 s jobs with cancel), fal (wan-t2v / wan-i2v), Replicate and Hugging Face with keys; the demo engine renders an honest animated GIF fallback.
- **Music** — text-to-music through a built-in **procedural synthesizer** (rule-based local synthesis at 44.1 kHz stereo — honestly labeled "not a neural model") and Replicate `meta/musicgen` with a key; key/mode/tempo parsed from the prompt.
- **Voice** — text-to-speech with 7 voices, 0.5–2× speed and 1024-char chunking (built-in engine), plus speech-to-text transcription with drag-and-drop audio and a *Use as prompt* hand-off into Text to Image.
- **Image search** — captioned web reference lookup through the built-in engine, with server-side downloads (mime-checked, stored as assets) straight onto the canvas.
- **110-tool catalog** — a new **Tools** view: a recipe book over real capabilities with search (200 ms debounce), 7 category tabs, and live availability resolved from the provider list ("available now · via Belentan Core, Pollinations" / "needs provider" / "local — instant, offline"). Every template recipe prefills its panel's prompt (or the speech script / search query / variations guidance), native recipes open their panel, and the two Prompt-Enhance entries trigger the Generate panel's LLM rewrite flow. 42 image · 20 video · 14 audio · 8 voice · 12 text · 4 reference · 10 utility entries — never a fake capability.
- **Adjust panel** — local pixel ops: crop-to-aspect (new), flip H/V, rotate 90° (mask-aware, re-dimensioning), grayscale/warm/cool grades, live-preview brightness & contrast, vignette and sharpen. All instant, offline, one undo step each.
- **Media history** — history strip, gallery and result cards render video and audio inline (players, waveforms, mime-aware downloads, metadata dialogs); gallery kind filters cover the new modalities.

### Changed
- **Providers view overhaul** for the 29-connection scale: summary strip ("29 connections · 3 ready now" + kind breakdown), kind filter chips and search, collapsible cards (priority #, kind badge, status dot, chevron) that expand to the full detail (description, capabilities across all 17 modalities, models, env vars, docs, test connection diagnostics, priority reordering that works on the global order even while filtered), and a scrollable list.
- Tool rail regrouped into IMAGE / VIDEO / AUDIO / VOICE / REFERENCE sections with a new **Tools** view nav entry carrying a live "110" badge.
- README rewritten around the 29-connection / 110-recipe story; `docs/providers.md` is now a full 29-provider matrix.

## [0.1.0] — First public build

### Added
- **Studio shell** — tool rail, canvas viewport, right parameters panel, history/results strip, status footer. Dark editorial identity (ember accent, Fraunces display type).
- **Canvas editor engine** — zoom/pan (wheel, space-drag), brush mask painting with size & hardness, eraser, invert/fill/clear mask, 14-step undo/redo, before/after hold-compare, checkerboard transparency, PNG/JPG/WEBP export, drag&drop/paste import with large-image normalization.
- **Provider architecture** — `AIProvider` adapter contract, registry with priority ordering (persisted), capability detection, `Test connection` diagnostics, AUTO/manual selection, automatic fallback with error classification (auth / rate-limit / quota / timeout / network / response).
- **Providers** — built-in engine (always on, zero keys), Qwen/DashScope (async task polling, verified endpoint), NVIDIA NIM (genai SD endpoints, artifacts[0].base64), Hugging Face (router.hf-inference), Ollama (tags/chat + experimental /api/generate images), ComfyUI (system_stats → /prompt → /history → /view workflow), demo engine (deterministic, watermarked, last resort).
- **Tools** — Generate (prompt builder, style presets, aspect/size, count, capability-driven negative/seed controls, LLM enhance), Generative Fill & Remove (magenta marker pipeline + pixel-perfect unmasked preservation), Generative Expand (local canvas growth + outpainting), Background (AI chroma-green pipeline + local keying with tolerance/feather), Upscale (local resample+unsharp / AI refine), Variations (strength levels).
- **Persistence** — Prisma/SQLite projects (image + mask + prompt + tool), generation history with assets & thumbnails (sharp), asset store on local filesystem served via API.
- **PWA manifest**, hardware detection panel, keyboard shortcuts, toasts, responsive layout (mobile params overlay), accessibility (aria labels, focus states, sr-only texts).
- **Docs** — README, architecture, providers (with verified sources), deployment, troubleshooting, env example, license, contributing, CI workflow.

### Known limitations
- Built-in edit API has no raw mask channel — masks travel as magenta region markers (documented strategy, with local pixel-perfect re-compositing).
- In-browser WebGPU/ONNX inference: architecture-ready, not yet implemented.
- NVIDIA trial limits and Ollama image generation are experimental upstream features; handled gracefully.

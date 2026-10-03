# Troubleshooting

Every generation records its provider, duration and full fallback chain — open **History** (bottom strip) before anything else; the error text there is the diagnosis.

## Generation

**"No available provider supports …"**
No configured provider has that capability. Check Providers view — the built-in engine covers generation/editing; if you disabled demo mode and the engine is down, re-enable it or configure a provider.

**"NVIDIA: rate limited (429)" / "quota exhausted (402)"**
Expected on the trial tier (credits were replaced by rate limits). AUTO mode already fell back to the next provider. Manual mode: switch to AUTO or another provider.

**"Qwen … did not finish in time" / task FAILED**
DashScope tasks are async; very long queues can exceed the 240 s poll budget. Retry. If it persists, check your quota in the Model Studio console.

**"Hugging Face returned application/json instead of an image"**
Usually exhausted monthly credits or a model not served by `hf-inference`. Try `FLUX.1-schnell`/SDXL, or lower this provider's priority.

**"Ollama returned no image data"**
Ollama image generation is experimental: `ollama pull x/z-image-turbo` and confirm your OS is supported (macOS first; Linux pending per the Jan 2026 blog).

**"ComfyUI has no checkpoints loaded"**
Drop a model into ComfyUI's `models/checkpoints` or set `FIRELAB_COMFY_MODEL`. Apache-2.0 options: Qwen-Image, FLUX.1-schnell.

**Everything failed and I got a "DEMO RESULT"**
That is the labeled last-resort fallback, not fake AI. Check History for the failure chain that led there; fix the top error or disable demo fallback in Settings if you prefer hard errors.

## Editor

**Brush doesn't paint**
Mask mode must be active — press `B` or click *Activate brush* in the Fill/Remove panel. Painting is disabled while holding `Space` (pan).

**"Paint a mask first" when running Fill/Remove**
The mask is required. The orange overlay shows the current selection; the small B/W thumbnail in the mask toolbar previews what will be sent.

**Filled area looks different outside the mask**
You ran with "Preserve unmasked pixels" off — turn it on (Advanced) and FireLab will re-composite the original pixels locally after the AI pass.

**Background removal left green edges**
Lower the tolerance or raise feather in the Background panel — the key re-runs live without new API calls. Some green spill is removed automatically.

**Undo lost steps**
History keeps 14 snapshots (memory-bounded). Mask strokes are one entry each.

## Projects / data

**"Nothing to save yet"** — generate or import an image first.

**Gallery empty after redeploy** — assets live in `db/firelab-assets/` on the server's disk; without a persistent volume they reset with the deployment.

**Reset everything** — stop the server and delete the `db/` folder (then `bun run db:push`).

## Providers / keys

**"DASHSCOPE_API_KEY is not configured"** — the key lives in `.env.local` at the project root (server-side); restart the dev server after editing it.

**Test connection shows endpoint mismatch for NVIDIA** — model endpoints occasionally differ per account; copy the exact URL/model from your build.nvidia.com model page into `FIRELAB_NVIDIA_IMAGE_MODEL`.

**Where are my keys?** — never in the browser, repo or logs. They are read from environment variables inside the API routes only. `git grep -iE "api_key|secret|token|sk-|bearer"` from a clean checkout returns only placeholder docs.

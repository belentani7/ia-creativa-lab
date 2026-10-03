# Providers guide — 29 connections

FireLab is **local-first, cloud-optional**. It starts with the **built-in engine** (zero keys) and the **DEMO fallback** (zero keys). Local runtimes activate automatically when their server is detected. Cloud providers activate only when a key is present in `.env.local` (read server-side only, never logged, never shipped to the browser). One provider — **Pollinations** — is keyless and activates automatically whenever it is reachable.

Status column reflects what was **verified during the build** (research pass + live probes, Feb 2026). Anything experimental is marked.

## The full matrix

| # | Provider | Kind | Key / env | Capabilities | Free-tier reality | Priority | Docs |
|---|---|---|---|---|---|---|---|
| 1 | Belentan Core (built-in) | builtin | — none — | textToImage · imageToImage · inpainting · outpainting · removeObject · removeBackground · variations · promptEnhance · textToVideo · imageToVideo *(experimental)* · textToMusic *(procedural, not neural)* · textToSpeech · speechToText · imageSearch | included with the runtime | 10 | — |
| 2 | Stable Diffusion WebUI (A1111 / Forge / SD.Next) | local | `FIRELAB_A1111_URL` (default `127.0.0.1:7860`) | textToImage · imageToImage · inpainting · outpainting · removeObject · variations · upscale · negativePrompt · seed | unlimited (your GPU) | 12 | [wiki](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/API) |
| 3 | ComfyUI | local | `FIRELAB_COMFYUI_URL` (default `127.0.0.1:8188`) | textToImage · negativePrompt · seed | unlimited (your GPU) | 14 | [docs.comfy.org](https://docs.comfy.org/) |
| 4 | Ollama | local | `FIRELAB_OLLAMA_URL` (default `127.0.0.1:11434`) | textToImage *(experimental)* · promptEnhance · seed | unlimited (your machine) | 16 | [docs.ollama.com](https://docs.ollama.com/) |
| 5 | whisper.cpp server | local | `FIRELAB_WHISPERCPP_URL` (default `127.0.0.1:8080`) | speechToText | unlimited (your machine) | 18 | [server example](https://github.com/ggml-org/whisper.cpp/tree/master/examples/server) |
| 6 | LM Studio | local | `FIRELAB_LMSTUDIO_URL` (default `127.0.0.1:1234/v1`) | promptEnhance | unlimited | 20 | [lmstudio.ai](https://lmstudio.ai/docs/app/api) |
| 7 | llama.cpp llama-server | local | `FIRELAB_LLAMACPP_URL` (default `127.0.0.1:8080/v1`) | promptEnhance | unlimited | 22 | [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) |
| 8 | Jan | local | `FIRELAB_JAN_URL` (default `127.0.0.1:1337/v1`) | promptEnhance | unlimited | 24 | [jan.ai](https://jan.ai/docs/api) |
| 9 | KoboldCpp | local | `FIRELAB_KOBOLDCPP_URL` (default `127.0.0.1:5001/v1`) | promptEnhance | unlimited | 26 | [LostRuins/koboldcpp](https://github.com/LostRuins/koboldcpp) |
| 10 | vLLM | local | `FIRELAB_VLLM_URL` (default `127.0.0.1:8000/v1`) | promptEnhance | unlimited | 28 | [docs.vllm.ai](https://docs.vllm.ai) |
| 11 | LocalAI | local | `FIRELAB_LOCALAI_URL` (default `127.0.0.1:8080/v1`) | promptEnhance | unlimited | 30 | [localai.io](https://localai.io) |
| 12 | text-generation-webui | local | `FIRELAB_TEXTGENWEBUI_URL` (default `127.0.0.1:5000/v1`) | promptEnhance | unlimited | 32 | [oobabooga](https://github.com/oobabooga/text-generation-webui) |
| 13 | Pollinations | cloud | — keyless — (optional `FIRELAB_POLLINATIONS_IMAGE_MODEL` / `FIRELAB_POLLINATIONS_TEXT_MODEL`) | textToImage · promptEnhance · seed | free anonymous tier, ~1 image / 15 s, watermark possible. No API key required — ever. | 40 | [APIDOCS.md](https://github.com/pollinations/pollinations/blob/master/APIDOCS.md) |
| 14 | Qwen · DashScope | cloud | `DASHSCOPE_API_KEY` | textToImage · negativePrompt · seed · promptEnhance | free quota for new users (amount varies per model) | 50 | [Model Studio docs](https://www.alibabacloud.com/help/en/model-studio/text-to-image-v2-api-reference) |
| 15 | NVIDIA NIM | cloud | `NVIDIA_API_KEY` | textToImage · negativePrompt · seed · promptEnhance *(needs text model env)* | trial/rate-limited (credits → rate limits per NVIDIA forums) | 55 | [NIM reference](https://docs.api.nvidia.com/nim/reference/stabilityai-stable-diffusion-xl-infer) |
| 16 | Google Gemini (AI Studio) | cloud | `GEMINI_API_KEY` | textToImage · imageToImage · promptEnhance · seed | free tier limits vary (~100–500 img/day) — check AI Studio | 60 | [ai.google.dev](https://ai.google.dev) |
| 17 | Together AI | cloud | `TOGETHER_API_KEY` | textToImage · promptEnhance · seed · negativePrompt | FLUX.1-schnell-**Free** endpoint + Llama-3.3-70B-Turbo-**Free** | 65 | [docs.together.ai](https://docs.together.ai) |
| 18 | Cloudflare Workers AI | cloud | `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` | textToImage · seed | 10k neurons/day free allocation (verify in dashboard) | 70 | [developers.cloudflare.com](https://developers.cloudflare.com/workers-ai) |
| 19 | Stability AI | cloud | `STABILITY_API_KEY` | textToImage · negativePrompt · seed | free trial credits at signup | 75 | [platform.stability.ai](https://platform.stability.ai/docs) |
| 20 | DeepInfra | cloud | `DEEPINFRA_API_KEY` | textToImage · promptEnhance | signup credits; response shape may vary — errors surface as diagnostics | 80 | [deepinfra.com](https://deepinfra.com) |
| 21 | Hugging Face Inference | cloud | `HF_TOKEN` | textToImage · negativePrompt · seed · textToVideo *(experimental)* | small monthly free credits; video via the router varies in availability | 85 | [inference providers](https://huggingface.co/docs/inference-providers/en/tasks/text-to-image) |
| 22 | fal.ai | cloud | `FAL_KEY` | textToImage · textToVideo · imageToVideo · seed | no permanent free tier — trial credits at signup | 90 | [docs.fal.ai](https://docs.fal.ai) |
| 23 | Replicate | cloud | `REPLICATE_API_TOKEN` | textToImage · textToVideo *(experimental)* · textToMusic · seed | no free tier — per-run pricing; music via `meta/musicgen` | 95 | [replicate.com/docs](https://replicate.com/docs) |
| 24 | Groq | cloud | `GROQ_API_KEY` | promptEnhance | free tier with per-model daily limits | 100 | [console.groq.com](https://console.groq.com) |
| 25 | Mistral La Plateforme | cloud | `MISTRAL_API_KEY` | promptEnhance | free experiment plan with monthly usage | 105 | [docs.mistral.ai](https://docs.mistral.ai) |
| 26 | DeepSeek | cloud | `DEEPSEEK_API_KEY` | promptEnhance | pay-per-token (cheap), no permanent free tier | 110 | [api-docs.deepseek.com](https://api-docs.deepseek.com) |
| 27 | Cerebras | cloud | `CEREBRAS_API_KEY` | promptEnhance | free tier ~1M tokens/day (unofficial) | 115 | [cloud.cerebras.ai](https://cloud.cerebras.ai) |
| 28 | OpenRouter | cloud | `OPENROUTER_API_KEY` | promptEnhance | ":free"-suffixed models (19 at last check) — 50 free requests/day | 120 | [openrouter.ai/docs](https://openrouter.ai/docs) |
| 29 | Demo Engine | demo | — none — | textToImage · variations · textToVideo *(animated GIF)* | — | 999 | — |

## Default AUTO chain

`AUTO` walks providers that (a) support the requested capability and (b) are currently usable, in priority order:

- **Images** — built-in → A1111 → ComfyUI → Ollama → Pollinations → Qwen → NVIDIA → Gemini → Together → Cloudflare → Stability → DeepInfra → HF → fal → Replicate → demo
- **Edits (fill / remove / expand / background / variations / refine)** — built-in → A1111 → ComfyUI → (Gemini imageToImage) → demo
- **Video (text → video)** — built-in (cogvideox-3, submit + poll; durations snap to 5 or 10 s) → HF router *(experimental)* → fal (wan-t2v) → Replicate (wan-2.1-t2v-fast) → demo (animated GIF, clearly labeled)
- **Video (image → video)** — built-in *(experimental — may reject data URLs)* → fal (wan-i2v) → demo
- **Music** — built-in procedural synth (**rule-based synthesis, honestly labeled — not a neural model**) → Replicate (meta/musicgen)
- **Speech (TTS)** — built-in engine (7 voices: `tongtong, chuichui, xiaochen, jam, kazi, douji, luodo`; text over 1024 chars is chunked and WAV-concatenated)
- **Transcription (STT)** — whisper.cpp (local, if running) → built-in ASR
- **Image search** — built-in (web image lookup with captions — reference gathering, not generation; no fallback chain)
- **Prompt enhancement** — built-in → Ollama → LM Studio → llama.cpp → Jan → KoboldCpp → vLLM → LocalAI → text-gen-webui → Pollinations → Qwen → NVIDIA *(if text model set)* → Gemini → Together → DeepInfra → Groq → Mistral → DeepSeek → Cerebras → OpenRouter

Reorder the chain in **Settings → Providers** (persisted in `db/firelab-config.json`). Manual mode pins one provider — no fallback, errors surface as actionable diagnostics.

Each failure is classified and surfaced (401/403 → "check the key"; 429 → "rate limited, falling back"; 402 → "quota/credits exhausted"; timeout/network → endpoint messages; capability mismatch in manual mode → "X does not support Y"). One attempt per provider per request — nothing loops.

## Honest labeling

- The **built-in music engine is procedural synthesis** — rules + oscillators, not a neural model. It is labeled `procedural-synth` in the Models view ("Rule-based local synthesis. Not a neural model.") and in every history entry.
- The **demo engine is not AI** — deterministic, watermarked, never presented as a generation.
- The **image search** fetches real web images for reference; it is not generation.
- **Experimental paths** (built-in image-to-video, Ollama image gen, HF router video, Replicate wan-t2v) degrade gracefully with actionable error messages, never silently.

## Provider notes (per file)

- `builtin.ts` — z-ai SDK engine: images, edits, enhancement, video submit+poll (`zai.async.result.query`), TTS (`audio.tts.create`, WAV), ASR (`audio.asr.create`), image search (`images.search.create`), music via `procedural-audio.ts`.
- `a1111.ts` — `sdapi/v1` (txt2img / img2img / extra-single-image). Mask-aware: uses the true alpha mask (`ImageEditRequest.mask`) when the client provides one; otherwise synthesizes a mask from the magenta composite (magenta-ish pixels → white). Forge and SD.Next share the API.
- `openai-compat.ts` — one factory, seven local servers (LM Studio, llama.cpp, Jan, KoboldCpp, vLLM, LocalAI, text-gen-webui). `/models` probe + `/chat/completions`.
- `cloud-llm.ts` — one factory, five cloud chat providers (Groq, Mistral, DeepSeek, Cerebras, OpenRouter). OpenRouter auto-picks a `:free` model when `FIRELAB_OPENROUTER_MODEL` is unset.
- `pollinations.ts` — keyless image GET + OpenAI-compatible text POST. Anonymous limit ~1 image / 15 s is enforced by a server-side serialized queue (16 s spacing).
- `together.ts`, `deepinfra.ts`, `cloudflare.ts`, `gemini.ts`, `stability.ts`, `fal.ts`, `replicate.ts`, `whispercpp.ts`, `huggingface.ts` — see the matrix above; every adapter classifies failures with `ProviderError` codes.

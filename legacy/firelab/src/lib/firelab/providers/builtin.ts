// BELENTANI FIRELAB — built-in engine provider (sandbox generative runtime, server-side)
// Wraps z-ai-web-dev-sdk. Always available inside this environment; the app
// treats it as the "local engine" so no cloud API key is ever required.
// Covers images, edits, enhancement, video (cogvideox-3, submit+poll), TTS
// (with proper WAV concatenation for long text), ASR, image search and — for
// music — honest rule-based local synthesis (procedural-audio.ts).
import ZAI from 'z-ai-web-dev-sdk'
import { BUILTIN_SUPPORTED_SIZES, type Capability, type DiagnosticCheck, type ProviderModelInfo } from '../types'
import { ENHANCE_SYSTEM_PROMPT, ENHANCE_SYSTEM_PROMPT_EDITORIAL } from '../prompt'
import { synthesizeMusicWav } from '../procedural-audio'
import { ProviderError, classifyHttpStatus, fetchWithTimeout, sleep } from './http'
import type {
  EnhanceRequest,
  GeneratedAudio,
  GeneratedImage,
  GeneratedVideo,
  ImageEditRequest,
  ImageGenRequest,
  ImageSearchResult,
  MusicRequest,
  ProviderAdapter,
  SpeechRequest,
  TranscriptionRequest,
  VideoGenRequest,
} from './types'

interface ChatCompletionResponse {
  choices: { message: { content: string } }[]
}

interface ImagesResponse {
  data: { base64: string }[]
}

interface VideoSubmitResponse {
  id: string
  task_status: string
}

interface VideoAsyncResult {
  task_status: string
  video_result?: { url: string }[]
}

interface AsrResponse {
  text?: string
}

interface ImageSearchResponse {
  success?: boolean
  results?: {
    original_url?: string
    caption?: string
    source?: string
    original_width?: string | number
    original_height?: string | number
  }[]
}

interface ZAIClient {
  chat: {
    completions: {
      create(args: {
        messages: { role: string; content: string }[]
        thinking?: { type: string }
      }): Promise<ChatCompletionResponse>
    }
  }
  images: {
    generations: {
      create(args: { prompt: string; size?: string }): Promise<ImagesResponse>
      edit(args: {
        prompt: string
        images: { url: string }[]
        size?: string
        model?: string
      }): Promise<ImagesResponse>
    }
    search: {
      create(args: { query: string; count?: number }): Promise<ImageSearchResponse>
    }
  }
  video: {
    generations: {
      create(args: {
        prompt?: string
        image_url?: string | string[]
        size?: string
        duration?: number
        quality?: 'speed' | 'quality'
        with_audio?: boolean
        watermark_enabled?: boolean
      }): Promise<VideoSubmitResponse>
    }
  }
  async: {
    result: {
      query(taskId: string): Promise<VideoAsyncResult>
    }
  }
  audio: {
    tts: {
      create(args: {
        input: string
        voice?: string
        speed?: number
        response_format?: string
        stream?: boolean
      }): Promise<Response>
    }
    asr: {
      create(args: { file_base64?: string }): Promise<AsrResponse>
    }
  }
}

let clientPromise: Promise<ZAIClient> | null = null

async function getClient(): Promise<ZAIClient> {
  if (!clientPromise) {
    clientPromise = (async () => (await ZAI.create()) as unknown as ZAIClient)()
  }
  return clientPromise
}

function dims(size: string): { width: number; height: number } {
  const [w, h] = size.split('x').map(Number)
  return { width: w || 1024, height: h || 1024 }
}

/** Map a raw SDK error into a classified ProviderError (429 → rate-limit). */
function mapSdkError(context: string, err: unknown): ProviderError {
  const msg = err instanceof Error ? err.message : String(err)
  if (/429|too many requests/i.test(msg)) {
    return new ProviderError(
      'rate-limit',
      `${context} is rate-limited (429). Wait a few minutes, or configure a cloud video provider.`,
      429
    )
  }
  return new ProviderError('response', `${context}: ${msg.slice(0, 240)}`)
}

// ---- WAV helpers (TTS chunk concatenation) ----

interface WavInfo {
  sampleRate: number
  channels: number
  bitsPerSample: number
  dataOffset: number
  dataSize: number
}

/** Parse a canonical RIFF/WAVE buffer: locate 'fmt ' and 'data' chunks. */
function parseWav(buffer: Buffer): WavInfo {
  if (buffer.length < 44 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new ProviderError('response', 'TTS returned a buffer that is not RIFF/WAVE audio.')
  }
  let pos = 12
  let fmt: WavInfo | null = null
  let dataOffset = -1
  let dataSize = 0
  while (pos + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', pos, pos + 4)
    const chunkSize = buffer.readUInt32LE(pos + 4)
    if (chunkId === 'fmt ') {
      fmt = {
        sampleRate: buffer.readUInt32LE(pos + 12),
        channels: buffer.readUInt16LE(pos + 10),
        bitsPerSample: buffer.readUInt16LE(pos + 22),
        dataOffset: -1,
        dataSize: 0,
      }
    } else if (chunkId === 'data') {
      dataOffset = pos + 8
      dataSize = Math.min(chunkSize, buffer.length - dataOffset)
    }
    pos += 8 + chunkSize + (chunkSize % 2)
  }
  if (!fmt || dataOffset < 0) {
    throw new ProviderError('response', 'TTS WAV buffer is missing fmt/data chunks.')
  }
  return { ...fmt, dataOffset, dataSize }
}

/** Concatenate same-format PCM WAV buffers under a fresh 44-byte header. */
function concatWavs(buffers: Buffer[]): Buffer {
  const infos = buffers.map(parseWav)
  const first = infos[0]
  for (const info of infos.slice(1)) {
    if (
      info.sampleRate !== first.sampleRate ||
      info.channels !== first.channels ||
      info.bitsPerSample !== first.bitsPerSample
    ) {
      throw new ProviderError(
        'response',
        'Cannot concatenate TTS chunks — audio formats differ between chunks. Try shorter text.'
      )
    }
  }
  const totalData = infos.reduce((sum, info) => sum + info.dataSize, 0)
  const out = Buffer.alloc(44 + totalData)
  out.write('RIFF', 0, 'ascii')
  out.writeUInt32LE(36 + totalData, 4)
  out.write('WAVE', 8, 'ascii')
  out.write('fmt ', 12, 'ascii')
  out.writeUInt32LE(16, 16)
  out.writeUInt16LE(1, 20) // PCM
  out.writeUInt16LE(first.channels, 22)
  out.writeUInt32LE(first.sampleRate, 24)
  out.writeUInt32LE((first.sampleRate * first.channels * first.bitsPerSample) / 8, 28)
  out.writeUInt16LE((first.channels * first.bitsPerSample) / 8, 32)
  out.writeUInt16LE(first.bitsPerSample, 34)
  out.write('data', 36, 'ascii')
  out.writeUInt32LE(totalData, 40)
  let offset = 44
  for (let i = 0; i < buffers.length; i++) {
    buffers[i].copy(out, offset, infos[i].dataOffset, infos[i].dataOffset + infos[i].dataSize)
    offset += infos[i].dataSize
  }
  return out
}

/** Split long text into ≤1000-char chunks at sentence boundaries. */
export function splitTextForTts(text: string, maxChunk = 1000): string[] {
  if (text.length <= maxChunk) return [text]
  const chunks: string[] = []
  let rest = text
  while (rest.length > maxChunk) {
    // find the LAST sentence end within the window
    let cut = -1
    const window = rest.slice(0, maxChunk)
    for (let i = window.length - 1; i >= 0; i--) {
      if ('.!?。！？;；'.includes(window[i])) {
        cut = i + 1
        break
      }
    }
    if (cut <= 0) {
      // fall back to a comma or space boundary
      for (let i = window.length - 1; i >= 0; i--) {
        if (',， 、\n'.includes(window[i])) {
          cut = i + 1
          break
        }
      }
    }
    if (cut <= 0) cut = maxChunk
    chunks.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut)
  }
  if (rest.trim().length > 0) chunks.push(rest.trim())
  return chunks
}

/** Voice ids accepted by the built-in TTS engine (verified live). */
export const BUILTIN_TTS_VOICES = [
  'tongtong',
  'chuichui',
  'xiaochen',
  'jam',
  'kazi',
  'douji',
  'luodo',
] as const

// ---- video ----

/** The video API accepts a fixed duration grid (5 or 10 s) — snap requests. */
function snapDuration(durationSec?: number): number {
  return durationSec && durationSec >= 10 ? 10 : 5
}

async function downloadVideo(url: string): Promise<{ base64: string; mime: string }> {
  const res = await fetchWithTimeout(url, { timeoutMs: 300000 })
  if (!res.ok) {
    throw new ProviderError(
      classifyHttpStatus(res.status, ''),
      `Built-in video download failed: HTTP ${res.status}`
    )
  }
  const mime = (res.headers.get('content-type') || 'video/mp4').split(';')[0]
  if (!/^video\//.test(mime) && !/^image\//.test(mime)) {
    throw new ProviderError('response', `Built-in video download returned unexpected content-type "${mime}".`)
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length > 50 * 1024 * 1024) {
    throw new ProviderError('response', 'Built-in video exceeds the 50 MB download cap.')
  }
  if (buffer.length === 0) throw new ProviderError('response', 'Built-in video download returned no bytes.')
  return { base64: buffer.toString('base64'), mime: mime.startsWith('video/') ? mime : 'video/mp4' }
}

export const builtinProvider: ProviderAdapter = {
  id: 'builtin',
  name: 'Belentan Core (built-in engine)',
  kind: 'builtin',
  description:
    'Generative engine bundled with this runtime. Text-to-image, image editing (fill/remove/expand/background/variations), prompt enhancement, video (text + image-to-video, experimental), speech synthesis & transcription, image search and procedural music — no external API key required. Music is rule-based synthesis, honestly labeled (not a neural model).',
  envVars: [],
  docsUrl: undefined,
  defaultPriority: 10,
  note:
    'Managed by the local runtime. Zero configuration. Image-to-video is experimental — cloud providers (fal / Replicate) give better results.',

  async isConfigured(): Promise<boolean> {
    return true
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return {
      textToImage: true,
      imageToImage: true,
      inpainting: true,
      outpainting: true,
      removeObject: true,
      removeBackground: true,
      variations: true,
      promptEnhance: true,
      textToVideo: true,
      imageToVideo: true, // experimental — the API may reject some data URLs
      textToMusic: true, // procedural synthesis, not a neural model
      textToSpeech: true,
      speechToText: true,
      imageSearch: true,
      // The built-in engine API takes prompt+image only — no native negative
      // prompt or seed parameters, so those controls are hidden when active.
      negativePrompt: false,
      seed: false,
      upscale: false,
    }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    const t0 = Date.now()
    try {
      const zai = await getClient()
      checks.push({ label: 'Engine reachable', ok: true, detail: 'Runtime engine initialised.' })
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'Reply with the single word OK.' },
          { role: 'user', content: 'ping' },
        ],
        thinking: { type: 'disabled' },
      })
      const content = completion.choices[0]?.message?.content ?? ''
      checks.push({
        label: 'Language capability',
        ok: content.trim().length > 0,
        detail: content.trim() ? 'Chat model responded.' : 'Empty response.',
      })
      checks.push({
        label: 'Image capability',
        ok: true,
        detail: 'Image endpoints exposed by the runtime (full check happens on first generation).',
      })
      checks.push({ label: 'Latency', ok: true, detail: `${Date.now() - t0} ms` })
    } catch (err) {
      checks.push({
        label: 'Engine reachable',
        ok: false,
        detail: err instanceof Error ? err.message : String(err),
      })
    }
    return checks
  },

  async generateImages(req: ImageGenRequest): Promise<GeneratedImage[]> {
    const size = (BUILTIN_SUPPORTED_SIZES as readonly string[]).includes(req.size)
      ? req.size
      : '1024x1024'
    const zai = await getClient()
    const tasks = Array.from({ length: req.count }, () =>
      zai.images.generations.create({ prompt: req.prompt, size })
    )
    const responses = await Promise.all(tasks)
    const { width, height } = dims(size)
    return responses.map((r) => {
      const base64 = r.data?.[0]?.base64
      if (!base64) throw new Error('Built-in engine returned no image data')
      return { base64, mime: 'image/png', width, height }
    })
  },

  async editImage(req: ImageEditRequest): Promise<GeneratedImage[]> {
    const size = (BUILTIN_SUPPORTED_SIZES as readonly string[]).includes(req.size)
      ? req.size
      : '1024x1024'
    const zai = await getClient()
    const tasks = Array.from({ length: req.count }, () =>
      zai.images.generations.edit({
        prompt: req.prompt,
        images: [{ url: req.image }],
        size,
      })
    )
    const responses = await Promise.all(tasks)
    const { width, height } = dims(size)
    return responses.map((r) => {
      const base64 = r.data?.[0]?.base64
      if (!base64) throw new Error('Built-in engine returned no image data')
      return { base64, mime: 'image/png', width, height }
    })
  },

  async enhancePrompt(req: EnhanceRequest): Promise<string> {
    const zai = await getClient()
    const system =
      req.mode === 'editorial' ? ENHANCE_SYSTEM_PROMPT_EDITORIAL : ENHANCE_SYSTEM_PROMPT
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: system },
        { role: 'user', content: req.prompt },
      ],
      thinking: { type: 'disabled' },
    })
    const content = completion.choices[0]?.message?.content?.trim()
    if (!content) throw new Error('Built-in engine returned an empty enhanced prompt')
    return content.replace(/^["']|["']$/g, '')
  },

  async generateVideos(req: VideoGenRequest): Promise<GeneratedVideo[]> {
    const zai = await getClient()
    const size = /\d+x\d+/.test(req.size) ? req.size : '1024x576'
    const duration = snapDuration(req.durationSec)
    const results: GeneratedVideo[] = []
    for (let i = 0; i < Math.max(1, Math.min(req.count, 4)); i++) {
      let submitted: VideoSubmitResponse
      try {
        submitted = await zai.video.generations.create({
          prompt: req.prompt,
          ...(req.image
            ? { image_url: req.image }
            : {}),
          size,
          duration,
          quality: 'speed',
          with_audio: false,
          watermark_enabled: false,
        })
      } catch (err) {
        if (req.image) {
          throw new ProviderError(
            'unsupported',
            'Built-in image-to-video rejected the data URL — configure fal.ai (wan-i2v) or try a smaller image.'
          )
        }
        throw mapSdkError('Built-in video engine', err)
      }
      if (!submitted?.id) {
        throw new ProviderError('response', 'Built-in video engine returned no task id.')
      }
      // poll until SUCCESS/FAIL — total budget 10 minutes
      const deadline = Date.now() + 600000
      let videoUrl: string | null = null
      let pollFailures = 0
      while (Date.now() < deadline) {
        await sleep(10000)
        let state: VideoAsyncResult | null = null
        try {
          state = await zai.async.result.query(submitted.id)
        } catch {
          // transient poll errors are retried (a few in a row are tolerated)
          pollFailures++
          if (pollFailures >= 5) {
            throw new ProviderError('response', 'Built-in video poll kept failing — try again shortly.')
          }
          continue
        }
        if (state.task_status === 'SUCCESS') {
          videoUrl = state.video_result?.[0]?.url ?? null
          break
        }
        if (state.task_status === 'FAIL') {
          throw new ProviderError(
            'response',
            req.image
              ? 'Built-in image-to-video task failed — configure fal.ai (wan-i2v) for reliable image-to-video.'
              : 'Built-in video task failed on the server side.'
          )
        }
      }
      if (!videoUrl) {
        throw new ProviderError('timeout', 'Built-in video task did not finish within 10 minutes.')
      }
      const { base64, mime } = await downloadVideo(videoUrl)
      const { width, height } = dims(size)
      results.push({ base64, mime, width, height, durationSec: duration })
    }
    return results
  },

  async generateMusic(req: MusicRequest): Promise<GeneratedAudio[]> {
    return Array.from({ length: Math.max(1, Math.min(req.count, 4)) }, (_, i) => {
      const { buffer, meta } = synthesizeMusicWav(req.prompt, req.durationSec, (req.seed ?? 0) + i * 101)
      return {
        base64: buffer.toString('base64'),
        mime: 'audio/wav',
        durationSec: req.durationSec,
        meta: { ...meta, engine: 'procedural-synth' },
      }
    })
  },

  async synthesizeSpeech(req: SpeechRequest): Promise<GeneratedAudio> {
    const zai = await getClient()
    const chunks = splitTextForTts(req.text)
    const buffers: Buffer[] = []
    for (const chunk of chunks) {
      const response = await zai.audio.tts
        .create({
          input: chunk,
          voice: req.voice,
          speed: Math.min(2, Math.max(0.5, req.speed)),
          response_format: 'wav',
          stream: false,
        })
        .catch((err: unknown) => {
          throw mapSdkError('Built-in speech synthesis', err)
        })
      if (!response || typeof response.arrayBuffer !== 'function') {
        throw new ProviderError('response', 'Built-in TTS returned an unexpected response shape.')
      }
      const buffer = Buffer.from(new Uint8Array(await response.arrayBuffer()))
      if (buffer.length === 0) {
        throw new ProviderError('response', 'Built-in TTS returned empty audio.')
      }
      buffers.push(buffer)
    }
    const wav = buffers.length === 1 ? buffers[0] : concatWavs(buffers)
    return { base64: wav.toString('base64'), mime: 'audio/wav' }
  },

  async transcribeAudio(req: TranscriptionRequest): Promise<{ text: string }> {
    const zai = await getClient()
    const comma = req.audio.indexOf(',')
    const base64 = comma >= 0 ? req.audio.slice(comma + 1) : req.audio
    if (!/^[A-Za-z0-9+/\s]*$/.test(base64.slice(0, 128))) {
      throw new ProviderError('unsupported', 'Transcription input must be a base64 data URL of audio.')
    }
    const result = await zai.audio.asr
      .create({ file_base64: base64.replace(/\s/g, '') })
      .catch((err: unknown) => {
        throw mapSdkError('Built-in transcription', err)
      })
    const text = result?.text?.trim()
    if (!text) throw new ProviderError('response', 'Built-in transcription returned no text.')
    return { text }
  },

  async searchImages(req: { query: string; num: number }): Promise<ImageSearchResult[]> {
    const zai = await getClient()
    const res = await zai.images.search
      .create({ query: req.query, count: Math.min(Math.max(req.num, 1), 24) })
      .catch((err: unknown) => {
        throw mapSdkError('Built-in image search', err)
      })
    if (!res) throw new ProviderError('response', 'Built-in image search returned no response.')
    if (res.success === false) {
      throw new ProviderError('response', 'Built-in image search reported failure for this query.')
    }
    const results = res.results ?? []
    if (results.length === 0) {
      throw new ProviderError('response', 'No results for this query — try different wording.')
    }
    return results
      .filter((r) => typeof r.original_url === 'string' && r.original_url.length > 0)
      .slice(0, req.num)
      .map((r) => ({
        url: r.original_url as string,
        caption: r.caption ?? '',
        source: r.source ?? '',
        width: r.original_width !== undefined ? Math.round(Number(r.original_width)) || undefined : undefined,
        height: r.original_height !== undefined ? Math.round(Number(r.original_height)) || undefined : undefined,
      }))
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    return [
      {
        id: 'builtin-engine',
        label: 'Belentan Core Engine',
        capabilities: ['textToImage', 'imageToImage', 'inpainting', 'outpainting', 'removeObject', 'removeBackground', 'variations', 'promptEnhance'],
        status: 'available',
        note: 'Runtime-managed engine — no download, no key. Sizes up to 1440×720.',
        source: 'bundled',
      },
      {
        id: 'builtin-video',
        label: 'Belentan Core Video (cogvideox-3)',
        capabilities: ['textToVideo', 'imageToVideo'],
        status: 'available',
        note: 'Submit + async poll. Durations snap to 5 or 10 s. Image-to-video experimental — may reject large data URLs.',
        source: 'bundled',
      },
      {
        id: 'builtin-voice',
        label: 'Belentan Core Voice (TTS + ASR)',
        capabilities: ['textToSpeech', 'speechToText'],
        status: 'available',
        note: `7 voices (${BUILTIN_TTS_VOICES.slice(0, 3).join(', ')}…). Text over 1024 chars is chunked and WAV-concatenated.`,
        source: 'bundled',
      },
      {
        id: 'procedural-synth',
        label: 'Procedural Synth',
        capabilities: ['textToMusic'],
        status: 'available',
        note: 'Rule-based local synthesis. Not a neural model.',
        source: 'bundled',
      },
      {
        id: 'builtin-image-search',
        label: 'Belentan Core Image Search',
        capabilities: ['imageSearch'],
        status: 'available',
        note: 'Web image lookup with captions — reference gathering, not generation.',
        source: 'bundled',
      },
    ]
  },
}

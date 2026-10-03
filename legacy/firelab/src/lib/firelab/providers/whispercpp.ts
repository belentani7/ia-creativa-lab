// BELENTANI FIRELAB — whisper.cpp server adapter (local STT, optional)
// VERIFIED: POST {base}/inference multipart (file: audio blob,
// response_format: json, temperature: 0) → {text} (some builds return
// {transcription}). Reachability: ANY HTTP response (even 404) counts as
// reachable; only a network error marks the server absent.
import type { Capability, DiagnosticCheck, ProviderModelInfo } from '../types'
import { ProviderError, fetchWithTimeout } from './http'
import type { ProviderAdapter, TranscriptionRequest } from './types'

function baseUrl(): string {
  return (process.env.FIRELAB_WHISPERCPP_URL || 'http://127.0.0.1:8080').replace(/\/+$/, '')
}

interface InferenceResponse {
  text?: string
  transcription?: string
}

async function reachable(): Promise<boolean> {
  try {
    await fetchWithTimeout(baseUrl(), { timeoutMs: 3000 })
    return true // any HTTP response (even 404) = the server is running
  } catch {
    return false
  }
}

export const whispercppProvider: ProviderAdapter = {
  id: 'whispercpp',
  name: 'whisper.cpp server (local STT)',
  kind: 'local',
  description:
    'Local speech-to-text via the whisper.cpp example server. Uploads the audio as multipart form data to POST /inference. Nothing leaves your machine.',
  envVars: ['FIRELAB_WHISPERCPP_URL'],
  docsUrl: 'https://github.com/ggml-org/whisper.cpp/tree/master/examples/server',
  defaultPriority: 18,
  note: 'Run `whisper-server -m ggml-model.bin` — default port 8080.',

  async isConfigured(): Promise<boolean> {
    return reachable()
  },

  capabilities(): Partial<Record<Capability, boolean>> {
    return { speechToText: true }
  },

  async testConnection(): Promise<DiagnosticCheck[]> {
    const checks: DiagnosticCheck[] = []
    if (!(await reachable())) {
      checks.push({
        label: 'Endpoint reachable',
        ok: false,
        detail: `No whisper.cpp server detected at ${baseUrl()}. Start it with \`whisper-server -m <model>\`.`,
      })
      return checks
    }
    checks.push({ label: 'Endpoint reachable', ok: true, detail: `${baseUrl()} responded.` })
    checks.push({
      label: 'Inference endpoint',
      ok: true,
      detail: 'POST /inference (multipart file upload) — verified on first transcription.',
    })
    return checks
  },

  async transcribeAudio(req: TranscriptionRequest): Promise<{ text: string }> {
    const comma = req.audio.indexOf(',')
    const dataUrl = comma >= 0 ? req.audio.slice(comma + 1) : req.audio
    const header = comma >= 0 ? req.audio.slice(0, comma) : ''
    const mime = /^data:([^;,]+)/.exec(header)?.[1] || 'audio/wav'
    let bytes: Buffer
    try {
      bytes = Buffer.from(dataUrl.replace(/\s/g, ''), 'base64')
    } catch {
      throw new ProviderError('unsupported', 'Transcription input must be a base64 data URL of audio.')
    }
    if (bytes.length === 0) {
      throw new ProviderError('unsupported', 'Transcription input audio is empty.')
    }
    const ext = mime.includes('mpeg') ? 'mp3' : mime.includes('webm') ? 'webm' : 'wav'
    const form = new FormData()
    form.append('file', new Blob([new Uint8Array(bytes)], { type: mime }), `audio.${ext}`)
    form.append('response_format', 'json')
    form.append('temperature', '0')
    const res = await fetchWithTimeout(`${baseUrl()}/inference`, {
      method: 'POST',
      body: form,
      timeoutMs: 180000,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new ProviderError(
        res.status === 404 ? 'response' : 'network',
        `whisper.cpp /inference returned HTTP ${res.status}. ${text.slice(0, 160)}`,
        res.status
      )
    }
    const body = (await res.json().catch(() => null)) as InferenceResponse | null
    const text = body?.text?.trim() ?? body?.transcription?.trim()
    if (!text) throw new ProviderError('response', 'whisper.cpp returned no transcript.')
    return { text }
  },

  async listModels(): Promise<ProviderModelInfo[]> {
    if (!(await reachable())) {
      return [
        {
          id: 'whispercpp-unavailable',
          label: 'whisper.cpp server not reachable',
          capabilities: [],
          status: 'unavailable',
          note: `Start the server at ${baseUrl()} to use local transcription.`,
        },
      ]
    }
    return [
      {
        id: 'whisper-ggml',
        label: 'whisper.cpp (loaded GGML model)',
        capabilities: ['speechToText'],
        status: 'available',
        source: 'ggml-org/whisper.cpp',
        note: 'The model loaded by the server (ggml-*.bin) is used.',
      },
    ]
  },
}

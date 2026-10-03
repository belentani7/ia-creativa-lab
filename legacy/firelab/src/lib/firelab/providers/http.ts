// BELENTANI FIRELAB — HTTP helpers for provider adapters (server only)

export class ProviderError extends Error {
  code:
    | 'auth'
    | 'rate-limit'
    | 'quota'
    | 'timeout'
    | 'network'
    | 'response'
    | 'unsupported'
    | 'unknown'
  status?: number

  constructor(
    code: ProviderError['code'],
    message: string,
    status?: number
  ) {
    super(message)
    this.name = 'ProviderError'
    this.code = code
    this.status = status
  }
}

export function classifyHttpStatus(status: number, body: string): ProviderError['code'] {
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'rate-limit'
  if (status === 402) return 'quota'
  if (status >= 500) return 'network'
  if (status === 404) return 'response'
  void body
  return 'response'
}

export interface FetchOptions extends RequestInit {
  timeoutMs?: number
}

export async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 20000, ...init } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ProviderError('timeout', `Request timed out after ${timeoutMs}ms`)
    }
    throw new ProviderError('network', err instanceof Error ? err.message : String(err))
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const res = await fetchWithTimeout(url, options)
  const text = await res.text()
  if (!res.ok) {
    throw new ProviderError(
      classifyHttpStatus(res.status, text),
      `HTTP ${res.status} — ${text.slice(0, 300)}`,
      res.status
    )
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new ProviderError('response', `Invalid JSON response: ${text.slice(0, 200)}`)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

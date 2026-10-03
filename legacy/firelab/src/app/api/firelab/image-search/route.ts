// POST /api/firelab/image-search — reference image lookup (built-in engine)
// action 'search': {query, num} → {results: [{url, caption, source, width, height}]}
// action 'download': {url} → server-side fetch (≤20 MB, 60 s), mime sniff,
// saved as an asset the editor can consume. Records an 'image-search' history
// entry with the query in prompt.
import { NextRequest, NextResponse } from 'next/server'
import { runImageSearch } from '@/lib/firelab/providers/manager'
import { saveAsset } from '@/lib/firelab/storage'
import { recordGeneration } from '@/lib/firelab/records'
import type { SavedAsset } from '@/lib/firelab/storage'
import type { AssetRef } from '@/lib/firelab/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

interface SearchBody {
  action: 'search' | 'download'
  query?: string
  num?: number
  url?: string
  projectId?: string | null
}

const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024

function toRef(asset: SavedAsset): AssetRef {
  return {
    id: asset.id,
    url: asset.url,
    thumbUrl: asset.thumbUrl,
    width: asset.width,
    height: asset.height,
    mime: asset.mime,
  }
}

export async function POST(req: NextRequest) {
  const started = Date.now()
  let body: SearchBody
  try {
    body = (await req.json()) as SearchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'search') {
    const query = (body.query ?? '').trim()
    if (!query) {
      return NextResponse.json({ error: 'A query is required.' }, { status: 400 })
    }
    const num = Math.min(Math.max(body.num ?? 12, 1), 24)
    try {
      const { results, providerId } = await runImageSearch(query, num)
      return NextResponse.json({
        results,
        providerId,
        query,
        durationMs: Date.now() - started,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image search failed'
      return NextResponse.json({ error: message }, { status: 502 })
    }
  }

  if (body.action === 'download') {
    const url = (body.url ?? '').trim()
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: 'Only http(s) URLs can be downloaded.' }, { status: 400 })
    }
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 60000)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) {
        return NextResponse.json(
          { error: `Download failed: HTTP ${res.status}.` },
          { status: 502 }
        )
      }
      const mime = (res.headers.get('content-type') || '').split(';')[0].trim()
      if (!mime.startsWith('image/')) {
        return NextResponse.json(
          { error: `Refused to download "${mime || 'unknown type'}" — only images are allowed.` },
          { status: 415 }
        )
      }
      const declaredLength = Number(res.headers.get('content-length') || '0')
      if (declaredLength > MAX_DOWNLOAD_BYTES) {
        return NextResponse.json(
          { error: 'Image exceeds the 20 MB download cap.' },
          { status: 413 }
        )
      }
      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length === 0) {
        return NextResponse.json({ error: 'Download returned no bytes.' }, { status: 502 })
      }
      if (buffer.length > MAX_DOWNLOAD_BYTES) {
        return NextResponse.json(
          { error: 'Image exceeds the 20 MB download cap.' },
          { status: 413 }
        )
      }
      const asset = await saveAsset({ base64: buffer.toString('base64'), mime }, 'search')
      const generation = await recordGeneration({
        kind: 'image-search',
        prompt: url,
        provider: 'image-search-download',
        projectId: body.projectId ?? null,
        assets: [asset],
        durationMs: Date.now() - started,
        params: { url, bytes: buffer.length, mime },
      })
      return NextResponse.json({
        asset: toRef(asset),
        generation,
        durationMs: Date.now() - started,
      })
    } catch (err) {
      const message =
        err instanceof Error && err.name === 'AbortError'
          ? 'Download timed out (60 s).'
          : err instanceof Error
            ? err.message
            : 'Download failed'
      return NextResponse.json({ error: message }, { status: 502 })
    } finally {
      clearTimeout(timer)
    }
  }

  return NextResponse.json(
    { error: 'Unknown action — use "search" or "download".' },
    { status: 400 }
  )
}

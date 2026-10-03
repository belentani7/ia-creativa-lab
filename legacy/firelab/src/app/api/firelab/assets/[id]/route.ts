// GET /api/firelab/assets/[id] — serve stored asset (or its thumbnail)
import { NextRequest, NextResponse } from 'next/server'
import { readAssetFile } from '@/lib/firelab/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const thumb = new URL(req.url).searchParams.get('t') === 'thumb'
  const file = await readAssetFile(id, thumb)
  if (!file) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }
  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.mime,
      'Content-Length': String(file.buffer.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

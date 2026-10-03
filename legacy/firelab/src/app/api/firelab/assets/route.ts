// POST /api/firelab/assets — upload an image (data URL) as a stored asset
import { NextRequest, NextResponse } from 'next/server'
import { saveImageAsset } from '@/lib/firelab/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { dataUrl?: string }
    if (!body.dataUrl || !body.dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'A data:image/... URL is required.' }, { status: 400 })
    }
    if (body.dataUrl.length > 14_000_000) {
      return NextResponse.json({ error: 'Image too large (>10 MB).' }, { status: 413 })
    }
    const asset = await saveImageAsset(body.dataUrl, 'upload')
    return NextResponse.json({ asset })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET/POST /api/firelab/providers/priority — provider fallback order
import { NextRequest, NextResponse } from 'next/server'
import { getProviderInfos, setProviderOrder } from '@/lib/firelab/providers/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const providers = await getProviderInfos()
  return NextResponse.json({ order: providers.map((p) => p.id) })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { order?: string[] }
    if (!Array.isArray(body.order)) {
      return NextResponse.json({ error: 'Missing order array' }, { status: 400 })
    }
    const providers = await setProviderOrder(body.order)
    return NextResponse.json({ providers, order: providers.map((p) => p.id) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update order' },
      { status: 500 }
    )
  }
}

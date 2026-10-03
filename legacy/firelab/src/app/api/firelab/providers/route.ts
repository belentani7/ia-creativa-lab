// GET /api/firelab/providers — registry snapshot with status + capabilities
import { NextResponse } from 'next/server'
import { getProviderInfos } from '@/lib/firelab/providers/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const providers = await getProviderInfos()
    return NextResponse.json({ providers })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load providers' },
      { status: 500 }
    )
  }
}

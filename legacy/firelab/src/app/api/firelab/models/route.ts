// GET /api/firelab/models — model catalog across providers
import { NextResponse } from 'next/server'
import { getProviderInfos } from '@/lib/firelab/providers/manager'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const providers = await getProviderInfos()
  const catalog = providers.flatMap((p) =>
    p.models.map((m) => ({
      providerId: p.id,
      providerName: p.name,
      providerKind: p.kind,
      providerStatus: p.status,
      ...m,
    }))
  )
  return NextResponse.json({ providers, catalog })
}

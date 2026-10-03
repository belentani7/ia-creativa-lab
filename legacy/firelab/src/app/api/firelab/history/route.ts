// GET /api/firelab/history — generation history (gallery feed)
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseGenerationRow } from '@/lib/firelab/records'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 60), 1), 200)
  const kind = url.searchParams.get('kind')
  const projectId = url.searchParams.get('projectId')

  const rows = await db.generation.findMany({
    where: {
      ...(kind ? { kind } : {}),
      ...(projectId ? { projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json({ generations: rows.map(parseGenerationRow) })
}

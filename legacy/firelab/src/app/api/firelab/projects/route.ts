// GET/POST /api/firelab/projects — project list & creation
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { EditorSnapshot } from '@/lib/firelab/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export interface ProjectDTO {
  id: string
  name: string
  canvas: EditorSnapshot
  createdAt: string
  updatedAt: string
}

function toDTO(row: {
  id: string
  name: string
  canvas: string
  createdAt: Date
  updatedAt: Date
}): ProjectDTO {
  let canvas: EditorSnapshot = {}
  try {
    canvas = JSON.parse(row.canvas) as EditorSnapshot
  } catch {
    canvas = {}
  }
  return {
    id: row.id,
    name: row.name,
    canvas,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function GET() {
  const rows = await db.project.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ projects: rows.map(toDTO) })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string
      canvas?: EditorSnapshot
    }
    const row = await db.project.create({
      data: {
        name: (body.name ?? 'Untitled').slice(0, 80) || 'Untitled',
        canvas: JSON.stringify(body.canvas ?? {}),
      },
    })
    return NextResponse.json({ project: toDTO(row) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}

// GET/PATCH/DELETE /api/firelab/projects/[id]
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { EditorSnapshot } from '@/lib/firelab/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseRow(row: {
  id: string
  name: string
  canvas: string
  createdAt: Date
  updatedAt: Date
}) {
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await db.project.findUnique({ where: { id } })
  if (!row) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  return NextResponse.json({ project: parseRow(row) })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const body = (await req.json()) as { name?: string; canvas?: EditorSnapshot }
    const data: { name?: string; canvas?: string } = {}
    if (typeof body.name === 'string') data.name = body.name.slice(0, 80) || 'Untitled'
    if (body.canvas && typeof body.canvas === 'object') data.canvas = JSON.stringify(body.canvas)
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }
    const row = await db.project.update({ where: { id }, data })
    return NextResponse.json({ project: parseRow(row) })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await db.generation.deleteMany({ where: { projectId: id } })
    await db.project.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}

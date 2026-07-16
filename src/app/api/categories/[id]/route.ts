import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { getCategoryRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncCategoryById } from '@/lib/odoo/category-sync'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = getCategoryRepository()
  const item = repo.getById(id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['categories.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const data = await request.json()
  const repo = getCategoryRepository()
  const updated = await repo.update(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (isOdooSyncEnabled()) {
    syncCategoryById(id)
  }
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['categories.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const repo = getCategoryRepository()
  const deleted = await repo.delete(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

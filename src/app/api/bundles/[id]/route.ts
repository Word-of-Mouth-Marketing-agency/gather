import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getBundleRepository } from '@/lib/repositories'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = getBundleRepository()
  const item = repo.getById(id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const data = await request.json()
  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    return NextResponse.json({ error: 'Offer end date cannot be before start date' }, { status: 400 })
  }
  if (Array.isArray(data.productIds)) {
    data.productIds = [...new Set(data.productIds)]
  }
  const repo = getBundleRepository()
  const updated = repo.update(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const repo = getBundleRepository()
  const deleted = repo.delete(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

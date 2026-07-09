import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById } from '@/lib/odoo/product-sync'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = getProductRepository()
  const product = repo.getById(id)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const data = await request.json()
  if (data.discountStartsAt && data.discountEndsAt && data.discountEndsAt < data.discountStartsAt) {
    return NextResponse.json({ error: 'Discount end date cannot be before start date' }, { status: 400 })
  }
  const repo = getProductRepository()
  const updated = repo.update(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (isOdooSyncEnabled()) {
    syncProductById(id)
  }
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const repo = getProductRepository()
  const deleted = repo.delete(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

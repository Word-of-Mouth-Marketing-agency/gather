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
  const oldProduct = repo.getById(id)
  const stockChanged = oldProduct && data.stock !== undefined && data.stock !== oldProduct.stock

  const updated = repo.update(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let syncResult
  if (isOdooSyncEnabled()) {
    syncResult = await syncProductById(id, stockChanged)
  }
  return NextResponse.json({ ...updated, odooSync: syncResult })
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

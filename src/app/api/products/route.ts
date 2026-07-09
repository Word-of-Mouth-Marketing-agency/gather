import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById } from '@/lib/odoo/product-sync'

export async function GET() {
  const repo = getProductRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const data = await request.json()
    if (data.discountStartsAt && data.discountEndsAt && data.discountEndsAt < data.discountStartsAt) {
      return NextResponse.json({ error: 'Discount end date cannot be before start date' }, { status: 400 })
    }
    const repo = getProductRepository()
    const product = repo.create(data)
    let syncResult
    if (isOdooSyncEnabled()) {
      syncResult = await syncProductById(product.id, product.stock > 0)
    }
    return NextResponse.json({ ...product, odooSync: syncResult }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

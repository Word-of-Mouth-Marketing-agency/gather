import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById } from '@/lib/odoo/product-sync'

export async function GET() {
  const repo = getProductRepository()
  return NextResponse.json(repo.getAll())
}

function normalizeSku(sku: unknown): string {
  return String(sku ?? '').trim().toUpperCase()
}

function validateSku(sku: string, excludeId?: string): string | null {
  if (!sku) return 'SKU is required for Odoo sync.'
  const repo = getProductRepository()
  const all = repo.getAll()
  const dup = all.find((p) => p.sku?.trim().toUpperCase() === sku && p.id !== excludeId)
  if (dup) return `SKU "${sku}" is already used by product "${dup.name}".`
  return null
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const data = await request.json()
    if (data.discountStartsAt && data.discountEndsAt && data.discountEndsAt < data.discountStartsAt) {
      return NextResponse.json({ error: 'Discount end date cannot be before start date' }, { status: 400 })
    }
    const sku = normalizeSku(data.sku)
    const skuError = validateSku(sku)
    if (skuError) return NextResponse.json({ error: skuError }, { status: 400 })

    const repo = getProductRepository()
    const product = repo.create({ ...data, sku })
    let syncResult
    if (isOdooSyncEnabled()) {
      syncResult = await syncProductById(product.id, product.stock > 0)
    }
    return NextResponse.json({ ...product, odooSync: syncResult }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

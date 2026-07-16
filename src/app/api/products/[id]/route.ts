import { NextResponse } from 'next/server'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById } from '@/lib/odoo/product-sync'
import { hasPermission } from '@/lib/permissions'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  requireAdminOrResponse,
  filterContentFields,
  filterPricingFields,
  filterStockFields,
  normalizeSku,
  normalizeStock,
  logOp,
} from '@/lib/product-permissions'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = getProductRepository()
  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
  const product = repo.getById(id, includeArchived)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminOrResponse(['products.content.write', 'products.pricing.write', 'products.stock.write'])
  if (auth instanceof NextResponse) return auth

  const canContent = hasPermission(auth.session.role, 'products.content.write')
  const canPricing = hasPermission(auth.session.role, 'products.pricing.write')
  const canStock = hasPermission(auth.session.role, 'products.stock.write')

  const { id } = await params
  const data = await request.json()

  const repo = getProductRepository()
  const oldProduct = repo.getById(id, true)
  if (!oldProduct) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updateData: Record<string, unknown> = {}

  if (canContent) Object.assign(updateData, filterContentFields(data))
  if (canPricing) Object.assign(updateData, filterPricingFields(data))
  if (canStock) {
    const stockData = filterStockFields(data)
    const normalized = normalizeStock(stockData.stock)
    if (normalized !== undefined) {
      stockData.stock = normalized
      stockData.stockStatus = normalized > 0 ? 'in_stock' : 'out_of_stock'
    }
    Object.assign(updateData, stockData)
  }

  if (canPricing && canContent) {
    if (data.discountStartsAt && data.discountEndsAt && data.discountEndsAt < data.discountStartsAt) {
      return NextResponse.json({ error: 'Discount end date cannot be before start date' }, { status: 400 })
    }
  }

  const sku = data.sku !== undefined ? normalizeSku(data.sku) : undefined
  if (sku !== undefined && canContent) {
    const all = repo.getAll(true)
    const dup = all.find((p) => p.sku?.trim().toUpperCase() === sku && p.id !== id)
    if (dup) return NextResponse.json({ error: `SKU "${sku}" is already used by product "${dup.name}".` }, { status: 400 })
  }

  if (canPricing && data.stock !== undefined && data.stock !== '') {
    const normalized = normalizeStock(data.stock)
    if (normalized === undefined) {
      return NextResponse.json({ error: 'Stock must be a valid number' }, { status: 400 })
    }
  }

  const stockChanged = updateData.stock !== undefined && Number(updateData.stock) !== Number(oldProduct.stock)

  const updated = await repo.update(id, updateData as Record<string, never>)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logOp('UPDATE', id, sku ?? updated.sku, `name="${updated.name}" stockChanged=${stockChanged}`)

  await recordAuditEvent({
    adminUserId: auth.session.adminUserId,
    adminEmail: auth.session.email,
    adminRole: auth.session.role,
    action: 'product.updated',
    targetType: 'product',
    targetId: id,
    metadata: { changedFields: Object.keys(updateData).join(',') },
  })

  let syncResult
  if (isOdooSyncEnabled()) {
    const startMs = Date.now()
    try {
      syncResult = await syncProductById(id, { pushStock: stockChanged, requestedStock: updateData.stock as number | undefined })
      logOp('UPDATE', id, sku ?? updated.sku, `odoo_sync=${syncResult.syncStatus} stock_push=${syncResult.stockPushStatus ?? 'n/a'} ${Date.now() - startMs}ms`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      syncResult = { syncStatus: 'sync_failed' as const, syncError: msg.slice(0, 500) }
      logOp('UPDATE', id, sku ?? updated.sku, `odoo_sync=error ${Date.now() - startMs}ms error="${msg.slice(0, 200)}"`)
    }
  }

  return NextResponse.json({ ...updated, odooSync: syncResult })
}

export async function DELETE() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
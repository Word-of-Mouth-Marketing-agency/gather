import { NextResponse } from 'next/server'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById } from '@/lib/odoo/product-sync'
import { hasPermission } from '@/lib/permissions'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  requireAdminOrResponse,
  ALL_FIELDS,
  filterContentFields,
  filterPricingFields,
  normalizeSku,
  validateSku,
  logOp,
} from '@/lib/product-permissions'

export async function GET(request: Request) {
  const repo = getProductRepository()
  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
  return NextResponse.json(repo.getAll(includeArchived))
}

export async function POST(request: Request) {
  const auth = await requireAdminOrResponse(['products.content.write', 'products.pricing.write'])
  if (auth instanceof NextResponse) return auth

  const canContent = hasPermission(auth.session.role, 'products.content.write')
  const canPricing = hasPermission(auth.session.role, 'products.pricing.write')

  try {
    const data = await request.json()

    let filtered: Record<string, unknown>
    if (canContent && canPricing) {
      filtered = { ...data }
      for (const key of Object.keys(filtered)) {
        if (!ALL_FIELDS.includes(key)) delete filtered[key]
      }
    } else if (canContent) {
      filtered = filterContentFields(data)
    } else if (canPricing) {
      filtered = filterPricingFields(data)
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sku = normalizeSku(filtered.sku ?? data.sku)
    if (canContent) {
      const skuError = validateSku(sku)
      if (skuError) return NextResponse.json({ error: skuError }, { status: 400 })
    }

    const repo = getProductRepository()
    const product = await repo.create({ ...filtered, sku } as never)
    logOp('CREATE', product.id, sku, `name="${product.name}"`)

    let syncResult
    if (isOdooSyncEnabled()) {
      const startMs = Date.now()
      try {
        syncResult = await syncProductById(product.id, product.stock > 0)
        logOp('CREATE', product.id, sku, `odoo_sync=${syncResult.syncStatus} odooId=${syncResult.odooProductId ?? 'none'} ${Date.now() - startMs}ms`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        syncResult = { syncStatus: 'sync_failed' as const, syncError: msg.slice(0, 500) }
        logOp('CREATE', product.id, sku, `odoo_sync=error ${Date.now() - startMs}ms error="${msg.slice(0, 200)}"`)
      }
    }

    return NextResponse.json({ ...product, odooSync: syncResult }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logOp('CREATE', 'unknown', undefined, `FAILED error="${msg.slice(0, 200)}"`)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

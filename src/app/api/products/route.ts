import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById } from '@/lib/odoo/product-sync'

export async function GET(request: Request) {
  const repo = getProductRepository()
  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
  return NextResponse.json(repo.getAll(includeArchived))
}

function normalizeSku(sku: unknown): string {
  return String(sku ?? '').trim().toUpperCase()
}

function validateSku(sku: string, excludeId?: string): string | null {
  if (!sku) return 'SKU is required for Odoo sync.'
  const repo = getProductRepository()
  const all = repo.getAll(true)
  const dup = all.find((p) => p.sku?.trim().toUpperCase() === sku && p.id !== excludeId)
  if (dup) return `SKU "${sku}" is already used by product "${dup.name}".`
  return null
}

function logOp(op: string, id: string, sku?: string, extra?: string) {
  const ts = new Date().toISOString()
  console.log(`[PRODUCT_${op}] id=${id}${sku ? ` sku=${sku}` : ''}${extra ? ` ${extra}` : ''} ts=${ts}`)
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
    logOp('CREATE', product.id, sku, `name="${product.name}" stock=${product.stock} categories=${JSON.stringify(data.categoryIds ?? [])}`)

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
    } else {
      logOp('CREATE', product.id, sku, 'odoo_sync=skipped (ODOO_SYNC_ENABLED=false)')
    }

    return NextResponse.json({ ...product, odooSync: syncResult }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logOp('CREATE', 'unknown', undefined, `FAILED error="${msg.slice(0, 200)}"`)
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

import type { Product } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, logSync } from './json-rpc'

const PRODUCTS_FILE = 'products.json'

export interface StockSyncResult {
  total: number
  withSku: number
  updated: number
  skippedMissingSku: number
  failed: number
  warnings: string[]
  errors: Record<string, string>
  timestamp: string
}

function now(): string {
  return new Date().toISOString()
}

function loadProducts(): Product[] {
  return readJson<Product[]>(PRODUCTS_FILE)
}

function saveProducts(items: Product[]): void {
  writeJson(PRODUCTS_FILE, items)
}

export async function syncStockFromOdoo(): Promise<StockSyncResult> {
  const config = getOdooConfig()
  if (!config) {
    throw new Error(
      'Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_PASSWORD in your .env.local file.',
    )
  }

  const allProducts = loadProducts()
  const withSku = allProducts.filter((p) => p.sku?.trim()).length

  const result: StockSyncResult = {
    total: allProducts.length,
    withSku,
    updated: 0,
    skippedMissingSku: 0,
    failed: 0,
    warnings: [],
    errors: {},
    timestamp: now(),
  }

  for (const product of allProducts) {
    try {
      await syncSingleProductStock(product, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors[product.id] = message
      result.failed += 1
    }
  }

  if (result.updated > 0 || result.failed > 0 || result.skippedMissingSku > 0) {
    saveProducts(loadProducts())
  }

  return result
}

async function syncSingleProductStock(
  product: Product,
  result: StockSyncResult,
): Promise<void> {
  const startMs = Date.now()
  const sku = product.sku?.trim()
  if (!sku) {
    result.skippedMissingSku += 1
    result.warnings.push(`Product "${product.name}" (${product.id}): skipped — no SKU`)
    return
  }

  let odooProductId: number | undefined

  if (product.odooProductId) {
    const existing = await odooSearchRead(
      'product.product',
      [['id', '=', product.odooProductId]],
      ['id', 'qty_available'],
      1,
      { context: { active_test: false } },
    )
    if (existing.length > 0) {
      odooProductId = existing[0].id as number
    }
  }

  if (!odooProductId) {
    const bySku = await odooSearchRead(
      'product.product',
      [['default_code', '=', sku]],
      ['id', 'qty_available'],
      1,
      { context: { active_test: false } },
    )
    if (bySku.length > 0) {
      odooProductId = bySku[0].id as number
    }
  }

  if (!odooProductId) {
    logSync({ direction: 'pull', entity: 'stock', localId: product.id, sku, operation: 'stock_pull', durationMs: Date.now() - startMs, result: 'failed', error: 'Not found in Odoo' })
    throw new Error(
      `Product "${product.name}" (sku=${sku}): not found in Odoo by odooProductId or default_code`,
    )
  }

  const odooData = await odooSearchRead<{ id: number; qty_available: number }>(
    'product.product',
    [['id', '=', odooProductId]],
    ['qty_available'],
    1,
    { context: { active_test: false } },
  )

  if (odooData.length === 0) {
    logSync({ direction: 'pull', entity: 'stock', localId: product.id, odooId: odooProductId, sku, operation: 'stock_pull', durationMs: Date.now() - startMs, result: 'failed', error: 'Odoo product disappeared' })
    throw new Error(
      `Product "${product.name}" (sku=${sku}): Odoo product ${odooProductId} disappeared during sync`,
    )
  }

  const qtyAvailable = odooData[0].qty_available
  const stockStatus = qtyAvailable > 0 ? 'in_stock' : 'out_of_stock'

  const all = loadProducts()
  const idx = all.findIndex((p) => p.id === product.id)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      stock: Math.max(0, Math.floor(qtyAvailable)),
      stockStatus,
    }
    saveProducts(all)
  }

  result.updated += 1
  logSync({ direction: 'pull', entity: 'stock', localId: product.id, odooId: odooProductId, sku, operation: 'stock_pull', durationMs: Date.now() - startMs, result: 'success' })
}

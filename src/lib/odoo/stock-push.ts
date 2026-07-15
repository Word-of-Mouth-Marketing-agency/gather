import type { Product } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate, odooExecuteKw, logSync, setWebhookCooldown } from './json-rpc'

const PRODUCTS_FILE = 'products.json'

function loadProducts(): Product[] {
  return readJson<Product[]>(PRODUCTS_FILE)
}

async function saveProducts(items: Product[]): Promise<void> {
  await writeJson(PRODUCTS_FILE, items)
}

async function getInternalLocationId(): Promise<number> {
  const locations = await odooSearchRead<{ id: number }>(
    'stock.location',
    [['usage', '=', 'internal'], ['active', '=', true]],
    ['id'],
    1,
  )
  if (locations.length === 0) throw new Error('No active internal stock location found')
  return locations[0].id as number
}

export async function pushStockToOdoo(
  productId: string,
  requestedStock?: number,
): Promise<{ stockPushStatus?: string; stockPushError?: string; confirmedStock?: number }> {
  const startMs = Date.now()
  const config = getOdooConfig()
  if (!config) return {}

  try {
    const all = loadProducts()
    const product = all.find((p) => p.id === productId)
    if (!product) {
      logSync({ direction: 'push', entity: 'stock', localId: productId, operation: 'stock_push', durationMs: Date.now() - startMs, result: 'skipped', error: 'Product not found locally' })
      return {}
    }

    const sku = product.sku?.trim()
    if (!sku) {
      logSync({ direction: 'push', entity: 'stock', localId: productId, operation: 'stock_push', durationMs: Date.now() - startMs, result: 'skipped', error: 'No SKU' })
      return { stockPushStatus: 'skipped', stockPushError: 'No SKU' }
    }

    let odooProductId: number | undefined

    if (product.odooProductId) {
      const existing = await odooSearchRead('product.product', [['id', '=', product.odooProductId]], ['id'], 1, { context: { active_test: false } })
      if (existing.length > 0) odooProductId = product.odooProductId
    }

    if (!odooProductId) {
      const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id'], 1, { context: { active_test: false } })
      if (bySku.length > 0) odooProductId = bySku[0].id as number
    }

    if (!odooProductId) {
      logSync({ direction: 'push', entity: 'stock', localId: productId, sku, operation: 'stock_push', durationMs: Date.now() - startMs, result: 'skipped', error: 'Product not found in Odoo' })
      return { stockPushStatus: 'skipped', stockPushError: 'Product not found in Odoo' }
    }

    const locationId = await getInternalLocationId()
    const desiredQty = Math.max(0, Math.floor(Number(requestedStock ?? product.stock) || 0))

    const existingQuant = await odooSearchRead<{ id: number }>(
      'stock.quant',
      [['product_id', '=', odooProductId], ['location_id', '=', locationId]],
      ['id'],
      1,
    )

    // Odoo 18 needs inventory_quantity_set=true before applying a counted quantity.
    const inventoryValues = { inventory_quantity: desiredQty, inventory_quantity_set: true }

    // Write inventory quantity with gather_sync_origin to suppress webhook on Odoo side
    if (existingQuant.length > 0) {
      await odooExecuteKw('stock.quant', 'write', [[existingQuant[0].id], inventoryValues], { context: { gather_sync_origin: 'website' } })
    } else {
      await odooCreate('stock.quant', {
        product_id: odooProductId,
        location_id: locationId,
        ...inventoryValues,
      })
    }

    // Set cooldown before apply as defense-in-depth
    setWebhookCooldown(sku)

    // Apply the inventory adjustment with gather_sync_origin to suppress webhook on Odoo side
    if (existingQuant.length > 0) {
      await odooExecuteKw('stock.quant', 'action_apply_inventory', [[existingQuant[0].id]], { context: { gather_sync_origin: 'website' } })
    } else {
      const newQuant = await odooSearchRead<{ id: number }>(
        'stock.quant',
        [['product_id', '=', odooProductId], ['location_id', '=', locationId]],
        ['id'],
        1,
      )
      if (newQuant.length > 0) {
        await odooExecuteKw('stock.quant', 'action_apply_inventory', [[newQuant[0].id]], { context: { gather_sync_origin: 'website' } })
      }
    }

    const confirmed = await odooSearchRead<{ id: number; qty_available: number }>(
      'product.product',
      [['id', '=', odooProductId]],
      ['id', 'qty_available'],
      1,
      { context: { active_test: false } },
    )
    const confirmedQty = Math.max(0, Math.floor(Number(confirmed[0]?.qty_available) || 0))

    if (confirmedQty !== desiredQty) {
      const message = `Odoo confirmed stock ${confirmedQty}, expected ${desiredQty}`
      logSync({ direction: 'push', entity: 'stock', localId: productId, odooId: odooProductId, sku, operation: 'stock_push', durationMs: Date.now() - startMs, result: 'failed', error: message })
      return { stockPushStatus: 'failed', stockPushError: message, confirmedStock: confirmedQty }
    }

    const stockStatus = confirmedQty > 0 ? 'in_stock' : 'out_of_stock'

    const updated = loadProducts()
    const idx = updated.findIndex((p) => p.id === productId)
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], stock: confirmedQty, stockStatus, syncError: undefined }
      await saveProducts(updated)
    }

    logSync({ direction: 'push', entity: 'stock', localId: productId, odooId: odooProductId, sku, operation: `stock_push old=${product.stock} requested=${desiredQty} confirmed=${confirmedQty}`, durationMs: Date.now() - startMs, result: 'success' })
    return { stockPushStatus: 'ok', confirmedStock: confirmedQty }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logSync({ direction: 'push', entity: 'stock', localId: productId, operation: 'stock_push', durationMs: Date.now() - startMs, result: 'failed', error: message })
    return { stockPushStatus: 'failed', stockPushError: message.slice(0, 500) }
  }
}

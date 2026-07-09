import type { Product } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate, odooExecuteKw } from './json-rpc'

const PRODUCTS_FILE = 'products.json'

function loadProducts(): Product[] {
  return readJson<Product[]>(PRODUCTS_FILE)
}

function saveProducts(items: Product[]): void {
  writeJson(PRODUCTS_FILE, items)
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

export async function pushStockToOdoo(productId: string): Promise<{ stockPushStatus?: string; stockPushError?: string }> {
  const config = getOdooConfig()
  if (!config) return {}

  try {
    const all = loadProducts()
    const product = all.find((p) => p.id === productId)
    if (!product) return {}

    const sku = product.sku?.trim()
    if (!sku) return { stockPushStatus: 'skipped', stockPushError: 'No SKU' }

    let odooProductId: number | undefined

    if (product.odooProductId) {
      const existing = await odooSearchRead('product.product', [['id', '=', product.odooProductId]], ['id'], 1)
      if (existing.length > 0) odooProductId = product.odooProductId
    }

    if (!odooProductId) {
      const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id'], 1)
      if (bySku.length > 0) odooProductId = bySku[0].id as number
    }

    if (!odooProductId) {
      return { stockPushStatus: 'skipped', stockPushError: 'Product not found in Odoo' }
    }

    const locationId = await getInternalLocationId()
    const desiredQty = Math.max(0, Math.floor(product.stock))

    const existingQuant = await odooSearchRead<{ id: number }>(
      'stock.quant',
      [['product_id', '=', odooProductId], ['location_id', '=', locationId]],
      ['id'],
      1,
    )

    if (existingQuant.length > 0) {
      await odooExecuteKw('stock.quant', 'write', [[existingQuant[0].id], { inventory_quantity: desiredQty }])
    } else {
      await odooCreate('stock.quant', {
        product_id: odooProductId,
        location_id: locationId,
        inventory_quantity: desiredQty,
      })
    }

    const confirmedQtyData = await odooSearchRead<{ qty_available: number }>(
      'product.product', [['id', '=', odooProductId]], ['qty_available'], 1,
    )
    const confirmedQty = confirmedQtyData.length > 0 ? Math.max(0, Math.floor(confirmedQtyData[0].qty_available)) : desiredQty
    const confirmedStatus = confirmedQty > 0 ? 'in_stock' : 'out_of_stock'

    const updated = loadProducts()
    const idx = updated.findIndex((p) => p.id === productId)
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], stock: confirmedQty, stockStatus: confirmedStatus }
      saveProducts(updated)
    }

    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { stockPushStatus: 'failed', stockPushError: message.slice(0, 500) }
  }
}

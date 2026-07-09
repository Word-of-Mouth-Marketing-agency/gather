import type { Product, Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead } from './json-rpc'

const PRODUCTS_FILE = 'products.json'
const CATEGORIES_FILE = 'categories.json'

export interface ProductPullResult {
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

function loadCategories(): Category[] {
  return readJson<Category[]>(CATEGORIES_FILE)
}

async function resolveOdooProductId(product: Product): Promise<number | null> {
  if (product.odooProductId) {
    const existing = await odooSearchRead('product.product', [['id', '=', product.odooProductId]], ['id'], 1)
    if (existing.length > 0) return product.odooProductId
  }

  const sku = product.sku?.trim()
  if (sku) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id'], 1)
    if (bySku.length > 0) return bySku[0].id as number
  }

  return null
}

function mapCategoryId(
  odooCategId: number | undefined,
  allCategories: Category[],
): string | undefined {
  if (odooCategId == null) return undefined
  const local = allCategories.find((c) => c.odooCategoryId === odooCategId)
  return local?.id
}

export async function pullProductsFromOdoo(): Promise<ProductPullResult> {
  const config = getOdooConfig()
  if (!config) {
    throw new Error(
      'Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_PASSWORD in your .env.local file.',
    )
  }

  const allProducts = loadProducts()
  const allCategories = loadCategories()
  const withSku = allProducts.filter((p) => p.sku?.trim()).length

  const result: ProductPullResult = {
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
      const sku = product.sku?.trim()
      if (!sku) {
        result.skippedMissingSku += 1
        continue
      }

      const odooProductId = await resolveOdooProductId(product)
      if (!odooProductId) {
        result.warnings.push(`Product "${product.name}" (sku=${sku}): not found in Odoo, skipped`)
        continue
      }

      const odooData = await odooSearchRead<Record<string, unknown>>(
        'product.product', [['id', '=', odooProductId]], [
          'default_code', 'name', 'list_price', 'description_sale', 'qty_available', 'categ_id',
        ], 1,
      )

      if (odooData.length === 0) {
        throw new Error(`Odoo product ${odooProductId} disappeared during pull`)
      }

      const odoo = odooData[0] as { id: number; default_code: string; name: string; list_price: number; description_sale: string | false; qty_available: number; categ_id: unknown }
      const qty = Math.max(0, Math.floor(odoo.qty_available))
      const stockStatus = qty > 0 ? 'in_stock' : 'out_of_stock'

      const odooCategId = Array.isArray(odoo.categ_id) ? (odoo.categ_id as [number, string])[0] : undefined
      const pulledCatId = mapCategoryId(odooCategId, allCategories)
      const updates: Partial<Product> = {
        name: odoo.name,
        price: odoo.list_price,
        shortDescription: odoo.description_sale || product.shortDescription || '',
        stock: qty,
        stockStatus,
        syncStatus: 'synced',
        syncError: undefined,
        lastSyncedAt: now(),
        odooProductId,
      }
      if (pulledCatId && !product.categoryIds.includes(pulledCatId)) {
        updates.categoryIds = [...product.categoryIds, pulledCatId]
      }

      const all = loadProducts()
      const idx = all.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...updates }
        saveProducts(all)
      }

      result.updated += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors[product.id] = message
      result.failed += 1

      const all = loadProducts()
      const idx = all.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], syncStatus: 'sync_failed', syncError: message.slice(0, 500), lastSyncedAt: now() }
        saveProducts(all)
      }
    }
  }

  return result
}

export async function pullSingleProductFromOdoo(params: { sku?: string; odooProductId?: number }): Promise<void> {
  const config = getOdooConfig()
  if (!config) return

  try {
    const allProducts = loadProducts()
    let product = params.sku
      ? allProducts.find((p) => p.sku?.trim().toUpperCase() === params.sku!.trim().toUpperCase())
      : undefined
    if (!product && params.odooProductId) {
      product = allProducts.find((p) => p.odooProductId === params.odooProductId)
    }
    if (!product) return

    const allCategories = loadCategories()
    const odooProductId = await resolveOdooProductId(product)
    if (!odooProductId) return

    const odooData = await odooSearchRead<Record<string, unknown>>(
      'product.product', [['id', '=', odooProductId]], [
        'default_code', 'name', 'list_price', 'description_sale', 'qty_available', 'categ_id',
      ], 1,
    )
    if (odooData.length === 0) return

    const odoo = odooData[0] as { id: number; default_code: string; name: string; list_price: number; description_sale: string | false; qty_available: number; categ_id: unknown }
    const qty = Math.max(0, Math.floor(odoo.qty_available))
    const odooCategId = Array.isArray(odoo.categ_id) ? (odoo.categ_id as [number, string])[0] : undefined
    const pulledCatId = mapCategoryId(odooCategId, allCategories)
    const updates: Partial<Product> = {
      name: odoo.name,
      price: odoo.list_price,
      shortDescription: odoo.description_sale || product.shortDescription || '',
      stock: qty,
      stockStatus: qty > 0 ? 'in_stock' : 'out_of_stock',
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: now(),
      odooProductId,
    }
    if (pulledCatId && !product.categoryIds.includes(pulledCatId)) {
      updates.categoryIds = [...product.categoryIds, pulledCatId]
    }

    const all = loadProducts()
    const idx = all.findIndex((p) => p.id === product!.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates }
      saveProducts(all)
    }
  } catch {
    // Webhook pull failure silently falls back to admin/cron pull
  }
}

import type { Product, Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, logSync } from './json-rpc'

const PRODUCTS_FILE = 'products.json'
const CATEGORIES_FILE = 'categories.json'

export interface ProductPullResult {
  total: number
  withSku: number
  updated: number
  archived: number
  restored: number
  skippedMissingSku: number
  failed: number
  warnings: string[]
  errors: Record<string, string>
  timestamp: string
}

export interface SingleProductPullResult {
  status: 'updated' | 'skipped' | 'failed'
  localId?: string
  odooProductId?: number
  sku?: string
  fieldsChanged?: string[]
  error?: string
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
    const existing = await odooSearchRead('product.product', [['id', '=', product.odooProductId]], ['id'], 1, { context: { active_test: false } })
    if (existing.length > 0) return product.odooProductId
  }

  const sku = product.sku?.trim()
  if (sku) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id'], 1, { context: { active_test: false } })
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

function mapCategoryIds(
  odooIds: unknown,
  allCategories: Category[],
): string[] {
  const ids: number[] = []
  if (Array.isArray(odooIds)) {
    for (const entry of odooIds) {
      if (Array.isArray(entry) && typeof entry[0] === 'number') {
        ids.push(entry[0])
      }
    }
  }
  return ids
    .map((oid) => {
      const local = allCategories.find((c) => c.odooCategoryId === oid)
      return local?.id
    })
    .filter((id): id is string => id !== undefined)
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
    archived: 0,
    restored: 0,
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
          'default_code', 'name', 'list_price', 'description_sale', 'qty_available', 'categ_id', 'active', 'x_nextjs_category_ids',
        ], 1, { context: { active_test: false } },
      )

      if (odooData.length === 0) {
        throw new Error(`Odoo product ${odooProductId} disappeared during pull`)
      }

      const startMs = Date.now()
      const odoo = odooData[0] as Record<string, unknown>
      const qty = Math.max(0, Math.floor(Number(odoo.qty_available) || 0))
      const stockStatus = qty > 0 ? 'in_stock' : 'out_of_stock'
      const odooActive = odoo.active !== false

      const odooCategId = Array.isArray(odoo.categ_id) ? (odoo.categ_id as unknown as [number, string])[0] : undefined
      const pulledCatIds = mapCategoryIds(odoo.x_nextjs_category_ids, allCategories)
      const pulledCatId = mapCategoryId(odooCategId, allCategories)
      const updates: Partial<Product> = {
        name: normalizeOdooText(odoo.name),
        price: typeof odoo.list_price === 'number' ? odoo.list_price : product.price,
        shortDescription: normalizeOdooText(odoo.description_sale) || product.shortDescription || '',
        stock: qty,
        stockStatus,
        isActive: odooActive,
        syncStatus: 'synced',
        syncError: undefined,
        lastSyncedAt: now(),
        odooProductId,
      }
      if (pulledCatIds.length > 0) {
        updates.categoryIds = pulledCatIds
      } else if (pulledCatId) {
        updates.categoryIds = pulledCatId ? [pulledCatId] : []
      }

      const all = loadProducts()
      const idx = all.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...updates }
        saveProducts(all)
      }

      const operation = !odooActive ? 'archived_in_odoo' : (product.isActive === false ? 'restored' : 'updated')
      result[operation === 'archived_in_odoo' ? 'archived' : operation === 'restored' ? 'restored' : 'updated'] += 1

      logSync({ direction: 'pull', entity: 'product', localId: product.id, odooId: odooProductId, sku, operation, durationMs: Date.now() - startMs, result: 'success' })
    } catch (err) {
      const startMs = Date.now()
      const message = err instanceof Error ? err.message : String(err)
      result.errors[product.id] = message
      result.failed += 1

      const all = loadProducts()
      const idx = all.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], syncStatus: 'sync_failed', syncError: message.slice(0, 500), lastSyncedAt: now() }
        saveProducts(all)
      }
      logSync({ direction: 'pull', entity: 'product', localId: product.id, sku: product.sku?.trim(), operation: 'pull', durationMs: Date.now() - startMs, result: 'failed', error: message })
    }
  }

  return result
}

function normalizeOdooText(val: unknown): string {
  if (typeof val === 'string') return val
  if (val && typeof val === 'object' && 'en_US' in (val as Record<string, unknown>)) {
    return String((val as Record<string, unknown>).en_US || '')
  }
  return String(val || '')
}

function changedUpdateFields(product: Product, updates: Partial<Product>): string[] {
  return Object.keys(updates).filter((key) => {
    const typedKey = key as keyof Product
    return JSON.stringify(product[typedKey]) !== JSON.stringify(updates[typedKey])
  })
}

export async function pullSingleProductFromOdoo(params: { sku?: string; odooProductId?: number }): Promise<SingleProductPullResult> {
  const config = getOdooConfig()
  if (!config) {
    return { status: 'skipped', sku: params.sku, odooProductId: params.odooProductId, error: 'Odoo is not configured' }
  }

  const startMs = Date.now()
  try {
    const allProducts = loadProducts()
    let product = params.sku
      ? allProducts.find((p) => p.sku?.trim().toUpperCase() === params.sku!.trim().toUpperCase())
      : undefined
    if (!product && params.odooProductId) {
      product = allProducts.find((p) => p.odooProductId === params.odooProductId)
    }
    if (!product) {
      logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku: params.sku, operation: 'webhook', durationMs: Date.now() - startMs, result: 'skipped', error: 'Product not found locally' })
      return { status: 'skipped', sku: params.sku, odooProductId: params.odooProductId, error: 'Product not found locally' }
    }

    const allCategories = loadCategories()
    const odooProductId = await resolveOdooProductId(product)
    if (!odooProductId) {
      logSync({ direction: 'pull', entity: 'product', localId: product.id, sku: product.sku?.trim(), operation: 'webhook', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo product not found' })
      return { status: 'skipped', localId: product.id, sku: product.sku?.trim(), error: 'Odoo product not found' }
    }

    const odooData = await odooSearchRead<Record<string, unknown>>(
      'product.product', [['id', '=', odooProductId]], [
        'default_code', 'name', 'list_price', 'description_sale', 'qty_available', 'categ_id', 'active', 'x_nextjs_category_ids',
      ], 1, { context: { active_test: false } },
    )
    if (odooData.length === 0) {
      logSync({ direction: 'pull', entity: 'product', localId: product.id, odooId: odooProductId, sku: product.sku?.trim(), operation: 'webhook', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo data empty' })
      return { status: 'skipped', localId: product.id, odooProductId, sku: product.sku?.trim(), error: 'Odoo data empty' }
    }

    const odoo = odooData[0] as Record<string, unknown>
    const qty = Math.max(0, Math.floor(Number(odoo.qty_available) || 0))
    const odooActive = odoo.active !== false
    const odooCategId = Array.isArray(odoo.categ_id) ? (odoo.categ_id as unknown as [number, string])[0] : undefined
    const pulledCatIds = mapCategoryIds(odoo.x_nextjs_category_ids, allCategories)
    const pulledCatId = mapCategoryId(odooCategId, allCategories)
    const updates: Partial<Product> = {
      name: normalizeOdooText(odoo.name),
      price: typeof odoo.list_price === 'number' ? odoo.list_price : product.price,
      shortDescription: normalizeOdooText(odoo.description_sale) || product.shortDescription || '',
      stock: qty,
      stockStatus: qty > 0 ? 'in_stock' : 'out_of_stock',
      isActive: odooActive,
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: now(),
      odooProductId,
    }
    if (pulledCatIds.length > 0) {
      updates.categoryIds = pulledCatIds
    } else if (pulledCatId) {
      updates.categoryIds = [pulledCatId]
    }

    const all = loadProducts()
    const idx = all.findIndex((p) => p.id === product!.id)
    const fieldsChanged = changedUpdateFields(all[idx] || product, updates)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates }
      saveProducts(all)
    }

    const operation = !odooActive ? 'archived_in_odoo' : 'product.updated'
    logSync({ direction: 'pull', entity: 'product', localId: product.id, odooId: odooProductId, sku: product.sku?.trim(), operation, durationMs: Date.now() - startMs, result: 'success' })
    return { status: 'updated', localId: product.id, odooProductId, sku: product.sku?.trim(), fieldsChanged }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logSync({ direction: 'pull', entity: 'product', localId: params.sku || 'unknown', sku: params.sku, operation: 'webhook', durationMs: Date.now() - startMs, result: 'failed', error: message })
    return { status: 'failed', sku: params.sku, odooProductId: params.odooProductId, error: message }
  }
}

import fs from 'fs'
import path from 'path'
import type { Product, Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate, odooWrite, odooExecuteKw, logSync, setWebhookCooldown } from './json-rpc'

const PRODUCTS_FILE = 'products.json'
const CATEGORIES_FILE = 'categories.json'
const PUBLIC_DIR = path.join(process.cwd(), 'public')

export interface ProductSyncResult {
  total: number
  withSku: number
  created: number
  updated: number
  archived: number
  skippedMissingSku: number
  failed: number
  missingCategoryMapping: number
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

async function saveProducts(items: Product[]): Promise<void> {
  await writeJson(PRODUCTS_FILE, items)
}

function loadCategories(): Category[] {
  return readJson<Category[]>(CATEGORIES_FILE)
}

function isValidSalePrice(salePrice: unknown): salePrice is number {
  return typeof salePrice === 'number' && Number.isFinite(salePrice) && salePrice > 0
}

function resolveOdooListPrice(product: Product): number | null {
  if (isValidSalePrice(product.salePrice)) {
    return product.salePrice
  }
  if (product.price != null && typeof product.price === 'number' && product.price > 0) {
    return product.price
  }
  return null
}

function logPriceMapping(product: Product, sku: string, odooListPrice: number, result: string): void {
  console.info('[ODOO_PRICE_MAP]', {
    sku,
    price: product.price,
    salePrice: product.salePrice,
    odooListPrice,
    result,
  })
}

function resolveDescription(product: Product): string {
  if (product.shortDescription?.trim()) return product.shortDescription.trim()
  if (product.description?.trim()) return product.description.trim()
  return ''
}

function resolveMainImage(images: string[], warnings: string[], label: string): string | undefined {
  const first = images[0]
  if (!first) return undefined

  if (first.startsWith('http://') || first.startsWith('https://')) {
    warnings.push(`${label}: skipping external URL "${first}" — only local images are synced`)
    return undefined
  }

  const relative = first.startsWith('/') ? first.slice(1) : first
  const filePath = path.join(PUBLIC_DIR, relative)

  try {
    const buffer = fs.readFileSync(filePath)
    return buffer.toString('base64')
  } catch {
    warnings.push(`${label}: could not read image at "${first}" (resolved to ${filePath}) — syncing without image`)
    return undefined
  }
}

async function resolveOdooCategory(
  catId: string,
  allCategories: Category[],
): Promise<{ odooCategoryId: number } | { error: string }> {
  const local = allCategories.find((c) => c.id === catId)
  if (!local || local.type !== 'category') {
    return { error: `Category "${catId}" not found or is not a category type` }
  }

  if (local.odooCategoryId) {
    const existing = await odooSearchRead('product.category', [['id', '=', local.odooCategoryId]], ['id'], 1)
    if (existing.length > 0) {
      return { odooCategoryId: local.odooCategoryId }
    }
  }

  const byNextjsId = await odooSearchRead('product.category', [['x_nextjs_id', '=', catId]], ['id'], 1)
  if (byNextjsId.length > 0) {
    return { odooCategoryId: byNextjsId[0].id as number }
  }

  const bySlug = await odooSearchRead('product.category', [['x_slug', '=', local.slug]], ['id'], 1)
  if (bySlug.length > 0) {
    return { odooCategoryId: bySlug[0].id as number }
  }

  return { error: `Odoo category mapping is required before syncing product. Category "${local.name}" (${catId}) has not been synced to Odoo. Sync categories first.` }
}

export async function syncProductsToOdoo(): Promise<ProductSyncResult> {
  const config = getOdooConfig()
  if (!config) {
    throw new Error(
      'Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_PASSWORD in your .env.local file.',
    )
  }

  const allProducts = loadProducts()
  const allCategories = loadCategories()

  const withSku = allProducts.filter((p) => p.sku?.trim()).length

  const result: ProductSyncResult = {
    total: allProducts.length,
    withSku,
    created: 0,
    updated: 0,
    archived: 0,
    skippedMissingSku: 0,
    failed: 0,
    missingCategoryMapping: 0,
    warnings: [],
    errors: {},
    timestamp: now(),
  }

  for (const product of allProducts) {
    try {
      await syncSingleProduct(product, allCategories, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors[product.id] = message
      result.failed += 1

      const idx = allProducts.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        allProducts[idx] = {
          ...allProducts[idx],
          syncStatus: 'sync_failed',
          syncError: message.slice(0, 500),
          lastSyncedAt: now(),
        }
      }
    }
  }

  if (result.created > 0 || result.updated > 0 || result.archived > 0 || result.failed > 0 || result.skippedMissingSku > 0) {
    await saveProducts(allProducts)
  }

  return result
}

async function syncSingleProduct(
  product: Product,
  allCategories: Category[],
  result: ProductSyncResult,
): Promise<void> {
  const startMs = Date.now()
  const sku = product.sku?.trim()

  if (!sku) {
    result.skippedMissingSku += 1
    const all = loadProducts()
    const idx = all.findIndex((p) => p.id === product.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], syncStatus: all[idx].syncStatus || 'not_synced' }
      await saveProducts(all)
    }
    result.warnings.push(`Product "${product.name}" (${product.id}): skipped — no SKU`)
    logSync({ direction: 'push', entity: 'product', localId: product.id, sku: undefined, operation: 'skip_no_sku', durationMs: Date.now() - startMs, result: 'skipped' })
    return
  }

  const odooListPrice = resolveOdooListPrice(product)
  if (odooListPrice === null) {
    logSync({ direction: 'push', entity: 'product', localId: product.id, sku, operation: 'sync', durationMs: Date.now() - startMs, result: 'failed', error: 'No valid price' })
    throw new Error(`No valid price for product "${product.name}" (${product.id}). salePrice=${product.salePrice}, price=${product.price}`)
  }

  let categoryId: number | undefined
  let categoryResolved = false
  for (const catId of product.categoryIds) {
    const resolved = await resolveOdooCategory(catId, allCategories)
    if ('odooCategoryId' in resolved) {
      categoryId = resolved.odooCategoryId
      categoryResolved = true
      break
    }
  }

  if (!categoryResolved) {
    result.missingCategoryMapping += 1
    const ids = product.categoryIds.join(', ')
    logSync({ direction: 'push', entity: 'product', localId: product.id, sku, operation: 'sync', durationMs: Date.now() - startMs, result: 'failed', error: 'No category mapping' })
    throw new Error(
      `Odoo category mapping is required before syncing product. ` +
      `Product "${product.name}" (sku=${sku}, id=${product.id}) has categoryIds=[${ids}]. ` +
      `None of these categories have been synced to Odoo. Sync categories first.`,
    )
  }

  const descriptionSale = resolveDescription(product)
  if (!descriptionSale) {
    result.warnings.push(`Product "${product.name}" (sku=${sku}): no description available, syncing with empty description_sale`)
  }

  let odooProductId: number | undefined
  let staleMapping = false

  if (product.odooProductId) {
    const existing = await odooSearchRead('product.product', [['id', '=', product.odooProductId]], ['id', 'product_tmpl_id'], 1, { context: { active_test: false } })
    if (existing.length > 0) {
      odooProductId = existing[0].id as number
    } else {
      staleMapping = true
    }
  }

  if (!odooProductId) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id', 'product_tmpl_id'], 1, { context: { active_test: false } })
    if (bySku.length > 0) {
      odooProductId = bySku[0].id as number
      if (staleMapping) {
        result.warnings.push(
          `Product "${product.name}" (sku=${sku}): local odooProductId ${product.odooProductId} is stale, recovered via SKU to Odoo ID ${odooProductId}`,
        )
      }
    } else if (staleMapping) {
      result.warnings.push(
        `Product "${product.name}" (sku=${sku}): local odooProductId ${product.odooProductId} is stale, SKU not found in Odoo — will create`,
      )
    }
  }

  const imageBase64 = resolveMainImage(product.images, result.warnings, `Product "${product.name}" (sku=${sku})`)
  const active = product.isActive !== false

  const allCategoryIds: number[] = []
  for (const catId of product.categoryIds) {
    const resolved = await resolveOdooCategory(catId, allCategories)
    if ('odooCategoryId' in resolved) {
      allCategoryIds.push(resolved.odooCategoryId)
    }
  }

  if (odooProductId) {
    const existing = await odooSearchRead('product.product', [['id', '=', odooProductId]], ['product_tmpl_id'], 1, { context: { active_test: false } })
    const templateId = existing[0]?.product_tmpl_id as [number, string] | undefined

    const variantValues: Record<string, unknown> = { default_code: sku }
    await odooWrite('product.product', odooProductId, variantValues)

    if (templateId) {
      const tmplId = Array.isArray(templateId) ? templateId[0] : templateId
      const templateValues: Record<string, unknown> = {
        name: product.name,
        list_price: odooListPrice,
        standard_price: odooListPrice,
        description_sale: descriptionSale || false,
        description: product.description || false,
        categ_id: categoryId,
        is_storable: true,
        x_nextjs_id: product.id,
        x_slug: product.slug,
        sale_ok: true,
        purchase_ok: true,
        active,
      }
      if (imageBase64) {
        templateValues.image_1920 = imageBase64
      }
      await odooWrite('product.template', tmplId as number, templateValues)
    }

    const operation = active ? 'update' : 'archive'
    const action = active ? 'updated' : 'archived'
    result[action === 'updated' ? 'updated' : 'archived'] += 1

    setWebhookCooldown(sku)
    logPriceMapping(product, sku, odooListPrice, operation)
    logSync({ direction: 'push', entity: 'product', localId: product.id, odooId: odooProductId, sku, operation, durationMs: Date.now() - startMs, result: 'success' })
  } else {
    if (product.isActive === false) {
      logSync({ direction: 'push', entity: 'product', localId: product.id, sku, operation: 'archive_skip', durationMs: Date.now() - startMs, result: 'skipped', error: 'Archived locally, no Odoo record to archive' })
      const all = loadProducts()
      const idx = all.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        all[idx] = { ...all[idx], syncStatus: 'synced', syncError: undefined, lastSyncedAt: now() }
        await saveProducts(all)
      }
      return
    }

    const createValues: Record<string, unknown> = {
      default_code: sku,
      name: product.name,
      list_price: odooListPrice,
      standard_price: odooListPrice,
      description_sale: descriptionSale || false,
      description: product.description || false,
      categ_id: categoryId,
      is_storable: true,
      x_nextjs_id: product.id,
      x_slug: product.slug,
      sale_ok: true,
      purchase_ok: true,
      active,
    }
    if (imageBase64) {
      createValues.image_1920 = imageBase64
    }
    const newProductId = await odooCreate('product.product', createValues)
    odooProductId = newProductId

    setWebhookCooldown(sku)
    logPriceMapping(product, sku, odooListPrice, 'create')
    logSync({ direction: 'push', entity: 'product', localId: product.id, odooId: odooProductId, sku, operation: 'create', durationMs: Date.now() - startMs, result: 'success' })
  }

  const all = loadProducts()
  const idx = all.findIndex((p) => p.id === product.id)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      odooProductId,
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: now(),
    }
    await saveProducts(all)
  }
}

export interface SyncProductResult {
  odooProductId?: number
  syncStatus: 'synced' | 'sync_failed' | 'skipped'
  syncError?: string
  stockPushStatus?: 'ok' | 'skipped' | 'failed'
  stockPushError?: string
}

export interface SyncProductOptions {
  pushStock?: boolean
  requestedStock?: number
}

export async function syncProductById(productId: string, options: SyncProductOptions | boolean = {}): Promise<SyncProductResult> {
  try {
    const pushStock = typeof options === 'boolean' ? options : options.pushStock === true
    const config = getOdooConfig()
    if (!config) return { syncStatus: 'skipped' }

    const allProducts = loadProducts()
    const product = allProducts.find((p) => p.id === productId)
    if (!product) return { syncStatus: 'skipped' }

    const allCategories = loadCategories()
    const fakeResult: ProductSyncResult = {
      total: 1, withSku: product.sku?.trim() ? 1 : 0,
      created: 0, updated: 0, archived: 0, skippedMissingSku: 0, failed: 0, missingCategoryMapping: 0,
      warnings: [], errors: {}, timestamp: now(),
    }
    await syncSingleProduct(product, allCategories, fakeResult)

    const updated = loadProducts()
    const idx = updated.findIndex((p) => p.id === productId)
    const odooProductId = idx >= 0 ? updated[idx].odooProductId : undefined

    let stockPushResult: { stockPushStatus?: string; stockPushError?: string } = {}
    if (pushStock && odooProductId && product.isActive !== false) {
      const { pushStockToOdoo } = await import('./stock-push')
      stockPushResult = await pushStockToOdoo(productId, typeof options === 'boolean' ? undefined : options.requestedStock)
    }

    return {
      odooProductId,
      syncStatus: 'synced',
      stockPushStatus: stockPushResult.stockPushStatus === 'failed' ? 'failed' : stockPushResult.stockPushStatus === 'skipped' ? 'skipped' : 'ok',
      stockPushError: stockPushResult.stockPushError,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const all = loadProducts()
    const idx = all.findIndex((p) => p.id === productId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], syncStatus: 'sync_failed', syncError: message.slice(0, 500), lastSyncedAt: now() }
      await saveProducts(all)
    }
    return { syncStatus: 'sync_failed', syncError: message.slice(0, 500) }
  }
}

export async function pushArchiveToOdoo(productId: string): Promise<void> {
  const startMs = Date.now()
  const config = getOdooConfig()
  if (!config) return

  const all = loadProducts()
  const product = all.find((p) => p.id === productId)
  if (!product) return

  const sku = product.sku?.trim()
  if (!sku) {
    logSync({ direction: 'push', entity: 'product', localId: productId, operation: 'archive', durationMs: Date.now() - startMs, result: 'skipped', error: 'No SKU' })
    return
  }

  let odooProductId = product.odooProductId
  if (!odooProductId) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id', 'product_tmpl_id'], 1, { context: { active_test: false } })
    if (bySku.length > 0) {
      odooProductId = bySku[0].id as number
    }
  }

  if (!odooProductId) {
    logSync({ direction: 'push', entity: 'product', localId: productId, sku, operation: 'archive', durationMs: Date.now() - startMs, result: 'skipped', error: 'No Odoo record found' })
    return
  }

  const existing = await odooSearchRead('product.product', [['id', '=', odooProductId]], ['product_tmpl_id', 'active'], 1, { context: { active_test: false } })
  if (existing.length === 0) {
    logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'archive', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo record not found' })
    return
  }

  if (existing[0].active === false) {
    logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'archive', durationMs: Date.now() - startMs, result: 'skipped', error: 'Already archived in Odoo' })
    return
  }

  const templateId = Array.isArray(existing[0].product_tmpl_id) ? existing[0].product_tmpl_id[0] : existing[0].product_tmpl_id
  await odooWrite('product.template', templateId as number, { active: false })
  setWebhookCooldown(sku)
  logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'archive', durationMs: Date.now() - startMs, result: 'success' })
}

export interface OdooDeleteResult {
  odooResult: 'deleted' | 'archived' | 'not_found' | 'skipped'
  warning?: string
}

export async function pushDeleteToOdoo(productId: string): Promise<OdooDeleteResult> {
  const startMs = Date.now()
  const config = getOdooConfig()
  if (!config) return { odooResult: 'skipped' }

  const all = loadProducts()
  const product = all.find((p) => p.id === productId)
  if (!product) return { odooResult: 'skipped' }

  const sku = product.sku?.trim()
  if (!sku) {
    logSync({ direction: 'push', entity: 'product', localId: productId, operation: 'delete', durationMs: Date.now() - startMs, result: 'skipped', error: 'No SKU' })
    return { odooResult: 'skipped' }
  }

  let odooProductId = product.odooProductId
  if (!odooProductId) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id', 'product_tmpl_id'], 1, { context: { active_test: false } })
    if (bySku.length > 0) {
      odooProductId = bySku[0].id as number
    }
  }

  if (!odooProductId) {
    logSync({ direction: 'push', entity: 'product', localId: productId, sku, operation: 'delete', durationMs: Date.now() - startMs, result: 'skipped', error: 'No Odoo record found' })
    return { odooResult: 'not_found' }
  }

  const existing = await odooSearchRead('product.product', [['id', '=', odooProductId]], ['product_tmpl_id', 'active'], 1, { context: { active_test: false } })
  if (existing.length === 0) {
    logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'delete', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo product not found (already deleted)' })
    return { odooResult: 'not_found' }
  }

  const templateId = Array.isArray(existing[0].product_tmpl_id) ? existing[0].product_tmpl_id[0] : existing[0].product_tmpl_id
  try {
    await odooExecuteKw('product.template', 'unlink', [[templateId as number]])
    setWebhookCooldown(sku)
    logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'delete', durationMs: Date.now() - startMs, result: 'success' })
    return { odooResult: 'deleted' }
  } catch (err) {
    // Hard delete failed (foreign key constraints from stock.move etc.). Archive instead.
    const unlinkMsg = err instanceof Error ? err.message : String(err)
    try {
      await odooWrite('product.template', templateId as number, { active: false })
      setWebhookCooldown(sku)
      logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'delete_archive_fallback', durationMs: Date.now() - startMs, result: 'success', error: `unlink failed, archived: ${unlinkMsg.slice(0, 150)}` })
      return {
        odooResult: 'archived',
        warning: 'Product deleted from website and archived in Odoo because it has inventory history.',
      }
    } catch (archiveErr) {
      const archiveMsg = archiveErr instanceof Error ? archiveErr.message : String(archiveErr)
      logSync({ direction: 'push', entity: 'product', localId: productId, odooId: odooProductId, sku, operation: 'delete', durationMs: Date.now() - startMs, result: 'failed', error: `unlink: ${unlinkMsg.slice(0, 150)} | archive: ${archiveMsg.slice(0, 150)}` })
      throw new Error(`Odoo unlink failed and archive fallback also failed: ${archiveMsg.slice(0, 200)}`)
    }
  }
}

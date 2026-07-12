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
  status: 'created' | 'updated' | 'skipped' | 'failed'
  localId?: string
  odooProductId?: number
  sku?: string
  operation?: 'create' | 'update' | 'skip'
  fieldsChanged?: string[]
  error?: string
}

interface ProductWebhookPullParams {
  event?: 'product.created' | 'product.updated' | 'stock.updated' | string
  sku?: string
  odooProductId?: number
  x_nextjs_id?: string
  x_slug?: string
}

interface OdooProductRecord {
  id: number
  default_code?: string | false
  qty_available?: number
  active?: boolean
  product_tmpl_id?: [number, string] | number
}

interface OdooTemplateRecord {
  id: number
  default_code?: string | false
  name?: unknown
  list_price?: number
  description_sale?: unknown
  categ_id?: [number, string] | number | false
  active?: boolean
  x_nextjs_id?: string | false
  x_slug?: string | false
  x_nextjs_category_ids?: unknown
}

interface OdooCategoryRecord {
  id: number
  x_nextjs_id?: string | false
  x_slug?: string | false
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

function normalizeSku(sku: unknown): string {
  return String(sku ?? '').trim()
}

function normalizeLookup(value: unknown): string {
  return String(value ?? '').trim().toUpperCase()
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

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'product'
}

function uniqueSlug(baseSlug: string, allProducts: Product[], excludeId?: string): string {
  const base = slugify(baseSlug)
  let slug = base
  let counter = 2
  while (allProducts.some((p) => p.slug === slug && p.id !== excludeId)) {
    slug = `${base}-${counter}`
    counter += 1
  }
  return slug
}

function uniqueProductId(preferredId: string | undefined, odooProductId: number, allProducts: Product[]): string {
  const base = preferredId?.trim() || `prod-odoo-${odooProductId}`
  if (!allProducts.some((p) => p.id === base)) return base

  let counter = 2
  while (allProducts.some((p) => p.id === `${base}-${counter}`)) {
    counter += 1
  }
  return `${base}-${counter}`
}

function templateIdFromProduct(record: OdooProductRecord): number | undefined {
  if (Array.isArray(record.product_tmpl_id)) return record.product_tmpl_id[0]
  if (typeof record.product_tmpl_id === 'number') return record.product_tmpl_id
  return undefined
}

async function findOdooProduct(params: ProductWebhookPullParams): Promise<OdooProductRecord | null> {
  const fields = ['id', 'default_code', 'qty_available', 'active', 'product_tmpl_id']
  const sku = normalizeSku(params.sku)

  if (sku) {
    const bySku = await odooSearchRead<OdooProductRecord>('product.product', [['default_code', '=', sku]], fields, 1, { context: { active_test: false } })
    if (bySku.length > 0) return bySku[0]
  }

  if (params.odooProductId) {
    const byId = await odooSearchRead<OdooProductRecord>('product.product', [['id', '=', params.odooProductId]], fields, 1, { context: { active_test: false } })
    if (byId.length > 0) return byId[0]

    const byTemplateId = await odooSearchRead<OdooTemplateRecord>(
      'product.template',
      [['id', '=', params.odooProductId]],
      ['id', 'default_code'],
      1,
      { context: { active_test: false } },
    )
    if (byTemplateId.length > 0) {
      const byTemplateVariant = await odooSearchRead<OdooProductRecord>(
        'product.product',
        [['product_tmpl_id', '=', byTemplateId[0].id]],
        fields,
        1,
        { context: { active_test: false } },
      )
      if (byTemplateVariant.length > 0) return byTemplateVariant[0]
    }
  }

  if (params.x_nextjs_id || params.x_slug) {
    const domain: unknown[] = params.x_nextjs_id
      ? [['x_nextjs_id', '=', params.x_nextjs_id]]
      : [['x_slug', '=', params.x_slug]]
    const templates = await odooSearchRead<OdooTemplateRecord>(
      'product.template',
      domain,
      ['id', 'default_code'],
      1,
      { context: { active_test: false } },
    )
    if (templates.length > 0) {
      const byTemplateVariant = await odooSearchRead<OdooProductRecord>(
        'product.product',
        [['product_tmpl_id', '=', templates[0].id]],
        fields,
        1,
        { context: { active_test: false } },
      )
      if (byTemplateVariant.length > 0) return byTemplateVariant[0]
    }
  }

  return null
}

async function fetchOdooTemplate(templateId: number): Promise<OdooTemplateRecord | null> {
  const data = await odooSearchRead<OdooTemplateRecord>(
    'product.template',
    [['id', '=', templateId]],
    ['id', 'default_code', 'name', 'list_price', 'description_sale', 'categ_id', 'active', 'x_nextjs_id', 'x_slug', 'x_nextjs_category_ids'],
    1,
    { context: { active_test: false } },
  )
  return data[0] || null
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

function extractOdooMany2manyIds(odooIds: unknown): number[] {
  const ids: number[] = []
  if (Array.isArray(odooIds)) {
    for (const entry of odooIds) {
      if (Array.isArray(entry) && typeof entry[0] === 'number') {
        ids.push(entry[0])
      } else if (typeof entry === 'number') {
        ids.push(entry)
      }
    }
  }
  return ids
}

function extractOdooCategoryId(categId: OdooTemplateRecord['categ_id']): number | undefined {
  if (Array.isArray(categId)) return categId[0]
  if (typeof categId === 'number') return categId
  return undefined
}

async function resolveLocalCategoryIds(
  template: OdooTemplateRecord,
  allCategories: Category[],
): Promise<string[]> {
  const odooIds = [
    ...extractOdooMany2manyIds(template.x_nextjs_category_ids),
    extractOdooCategoryId(template.categ_id),
  ].filter((id): id is number => typeof id === 'number')

  const mapped = new Set<string>()
  const unmappedIds: number[] = []

  for (const odooId of odooIds) {
    const byLocalOdooId = allCategories.find((c) => c.type === 'category' && c.odooCategoryId === odooId)
    if (byLocalOdooId) {
      mapped.add(byLocalOdooId.id)
    } else {
      unmappedIds.push(odooId)
    }
  }

  if (unmappedIds.length > 0) {
    const odooCategories = await odooSearchRead<OdooCategoryRecord>(
      'product.category',
      [['id', 'in', Array.from(new Set(unmappedIds))]],
      ['id', 'x_nextjs_id', 'x_slug'],
      undefined,
      { context: { active_test: false } },
    )

    for (const odooCategory of odooCategories) {
      const nextjsId = typeof odooCategory.x_nextjs_id === 'string' ? odooCategory.x_nextjs_id.trim() : ''
      const slug = typeof odooCategory.x_slug === 'string' ? odooCategory.x_slug.trim() : ''
      const local = allCategories.find((c) => (
        c.type === 'category'
        && (
          (nextjsId && c.id === nextjsId)
          || (slug && c.slug === slug)
          || c.odooCategoryId === odooCategory.id
        )
      ))
      if (local) mapped.add(local.id)
    }
  }

  return Array.from(mapped)
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

export async function pullSingleProductFromOdoo(params: ProductWebhookPullParams): Promise<SingleProductPullResult> {
  const config = getOdooConfig()
  if (!config) {
    return { status: 'skipped', operation: 'skip', sku: params.sku, odooProductId: params.odooProductId, error: 'Odoo is not configured' }
  }

  const startMs = Date.now()
  try {
    const odooProduct = await findOdooProduct(params)
    if (!odooProduct) {
      logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku: params.sku, odooId: params.odooProductId, operation: 'webhook', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo product not found' })
      return { status: 'skipped', operation: 'skip', sku: params.sku, odooProductId: params.odooProductId, error: 'Odoo product not found' }
    }

    const templateId = templateIdFromProduct(odooProduct)
    if (!templateId) {
      logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku: params.sku, odooId: odooProduct.id, operation: 'webhook', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo template not found' })
      return { status: 'skipped', operation: 'skip', sku: params.sku, odooProductId: odooProduct.id, error: 'Odoo template not found' }
    }

    const template = await fetchOdooTemplate(templateId)
    if (!template) {
      logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku: params.sku, odooId: odooProduct.id, operation: 'webhook', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo template data empty' })
      return { status: 'skipped', operation: 'skip', sku: params.sku, odooProductId: odooProduct.id, error: 'Odoo template data empty' }
    }

    const sku = normalizeSku(odooProduct.default_code || template.default_code || params.sku)
    const templateNextjsId = typeof template.x_nextjs_id === 'string' ? template.x_nextjs_id.trim() : ''
    const templateSlug = typeof template.x_slug === 'string' ? template.x_slug.trim() : ''
    const payloadNextjsId = params.x_nextjs_id?.trim() || templateNextjsId
    const payloadSlug = params.x_slug?.trim() || templateSlug

    const allProducts = loadProducts()
    let product = sku
      ? allProducts.find((p) => normalizeLookup(p.sku) === normalizeLookup(sku))
      : undefined
    if (!product && payloadNextjsId) {
      product = allProducts.find((p) => p.id === payloadNextjsId)
    }
    if (!product && params.odooProductId) {
      product = allProducts.find((p) => p.odooProductId === params.odooProductId || p.odooProductId === odooProduct.id)
    }
    if (!product) {
      product = allProducts.find((p) => p.odooProductId === odooProduct.id)
    }

    const allCategories = loadCategories()
    const pulledCatIds = await resolveLocalCategoryIds(template, allCategories)
    const qty = Math.max(0, Math.floor(Number(odooProduct.qty_available) || 0))
    const odooActive = template.active !== false && odooProduct.active !== false
    const price = typeof template.list_price === 'number' ? template.list_price : NaN
    const name = normalizeOdooText(template.name)
    const shortDescription = normalizeOdooText(template.description_sale)

    if (!product) {
      if (params.event !== 'product.created') {
        logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku, odooId: odooProduct.id, operation: 'skip', durationMs: Date.now() - startMs, result: 'skipped', error: 'Product not found locally' })
        return { status: 'skipped', operation: 'skip', sku, odooProductId: odooProduct.id, error: 'Product not found locally' }
      }

      if (!sku) {
        logSync({ direction: 'pull', entity: 'product', localId: 'unknown', odooId: odooProduct.id, operation: 'skip', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo product has no SKU' })
        return { status: 'skipped', operation: 'skip', odooProductId: odooProduct.id, error: 'Odoo product has no SKU' }
      }
      if (!Number.isFinite(price) || price <= 0) {
        logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku, odooId: odooProduct.id, operation: 'skip', durationMs: Date.now() - startMs, result: 'skipped', error: 'Odoo product price is missing or invalid' })
        return { status: 'skipped', operation: 'skip', sku, odooProductId: odooProduct.id, error: 'Odoo product price is missing or invalid' }
      }
      if (pulledCatIds.length === 0) {
        logSync({ direction: 'pull', entity: 'product', localId: 'unknown', sku, odooId: odooProduct.id, operation: 'skip', durationMs: Date.now() - startMs, result: 'skipped', error: 'No mapped local category for Odoo product' })
        return { status: 'skipped', operation: 'skip', sku, odooProductId: odooProduct.id, error: 'No mapped local category for Odoo product' }
      }

      const id = uniqueProductId(payloadNextjsId, odooProduct.id, allProducts)
      const newProduct: Product = {
        id,
        slug: uniqueSlug(payloadSlug || name || sku, allProducts),
        name: name || sku,
        nameAr: '',
        description: shortDescription || name || sku,
        descriptionAr: '',
        shortDescription,
        shortDescriptionAr: '',
        price,
        salePrice: null,
        currency: 'EGP',
        images: [],
        categoryIds: pulledCatIds,
        occasionIds: [],
        stock: qty,
        stockStatus: qty > 0 ? 'in_stock' : 'out_of_stock',
        crossSellIds: [],
        frequentlyBoughtTogetherIds: [],
        featured: false,
        createdAt: now(),
        sku,
        odooProductId: odooProduct.id,
        syncStatus: 'synced',
        syncError: undefined,
        lastSyncedAt: now(),
        isActive: odooActive,
      }

      saveProducts([...allProducts, newProduct])
      logSync({ direction: 'pull', entity: 'product', localId: id, odooId: odooProduct.id, sku, operation: 'create', durationMs: Date.now() - startMs, result: 'success' })
      return { status: 'created', operation: 'create', localId: id, odooProductId: odooProduct.id, sku, fieldsChanged: Object.keys(newProduct) }
    }

    const updates: Partial<Product> = {
      name: name || product.name,
      price: Number.isFinite(price) && price > 0 ? price : product.price,
      shortDescription: shortDescription || product.shortDescription || '',
      stock: qty,
      stockStatus: qty > 0 ? 'in_stock' : 'out_of_stock',
      isActive: odooActive,
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: now(),
      odooProductId: odooProduct.id,
    }
    if (pulledCatIds.length > 0) {
      updates.categoryIds = pulledCatIds
    }

    const all = loadProducts()
    const idx = all.findIndex((p) => p.id === product!.id)
    const fieldsChanged = changedUpdateFields(all[idx] || product, updates)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates }
      saveProducts(all)
    }

    logSync({ direction: 'pull', entity: 'product', localId: product.id, odooId: odooProduct.id, sku, operation: 'update', durationMs: Date.now() - startMs, result: 'success' })
    return { status: 'updated', operation: 'update', localId: product.id, odooProductId: odooProduct.id, sku, fieldsChanged }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logSync({ direction: 'pull', entity: 'product', localId: params.sku || 'unknown', sku: params.sku, operation: 'webhook', durationMs: Date.now() - startMs, result: 'failed', error: message })
    return { status: 'failed', sku: params.sku, odooProductId: params.odooProductId, error: message }
  }
}

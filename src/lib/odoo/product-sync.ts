import type { Product, Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate, odooWrite } from './json-rpc'

const PRODUCTS_FILE = 'products.json'
const CATEGORIES_FILE = 'categories.json'

export interface ProductSyncResult {
  created: number
  updated: number
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

function saveProducts(items: Product[]): void {
  writeJson(PRODUCTS_FILE, items)
}

function loadCategories(): Category[] {
  return readJson<Category[]>(CATEGORIES_FILE)
}

function resolvePrice(product: Product): number | null {
  if (product.salePrice != null && typeof product.salePrice === 'number' && product.salePrice > 0) {
    return product.salePrice
  }
  if (product.price != null && typeof product.price === 'number' && product.price > 0) {
    return product.price
  }
  return null
}

function resolveDescription(product: Product): string {
  if (product.shortDescription?.trim()) return product.shortDescription.trim()
  if (product.description?.trim()) return product.description.trim()
  return ''
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

  const result: ProductSyncResult = {
    created: 0,
    updated: 0,
    skippedMissingSku: 0,
    failed: 0,
    missingCategoryMapping: 0,
    warnings: [],
    errors: {},
    timestamp: now(),
  }

  const allProducts = loadProducts()
  const allCategories = loadCategories()

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

  if (result.created > 0 || result.updated > 0 || result.failed > 0 || result.skippedMissingSku > 0) {
    saveProducts(allProducts)
  }

  return result
}

async function syncSingleProduct(
  product: Product,
  allCategories: Category[],
  result: ProductSyncResult,
): Promise<void> {
  const sku = product.sku?.trim()
  if (!sku) {
    result.skippedMissingSku += 1
    const idx = loadProducts().findIndex((p) => p.id === product.id)
    if (idx >= 0) {
      const all = loadProducts()
      all[idx] = {
        ...all[idx],
        syncStatus: all[idx].syncStatus || 'not_synced',
      }
      saveProducts(all)
    }
    result.warnings.push(`Product "${product.name}" (${product.id}): skipped — no SKU`)
    return
  }

  const price = resolvePrice(product)
  if (price === null) {
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

  if (product.odooProductId) {
    const existing = await odooSearchRead('product.product', [['id', '=', product.odooProductId]], ['id', 'product_tmpl_id'], 1)
    if (existing.length > 0) {
      odooProductId = existing[0].id as number
    }
  }

  if (!odooProductId) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id', 'product_tmpl_id'], 1)
    if (bySku.length > 0) {
      odooProductId = bySku[0].id as number
    }
  }

  if (odooProductId) {
    const existing = await odooSearchRead('product.product', [['id', '=', odooProductId]], ['product_tmpl_id'], 1)
    const templateId = existing[0]?.product_tmpl_id as [number, string] | undefined

    await odooWrite('product.product', odooProductId, { default_code: sku })

    if (templateId) {
      const tmplId = Array.isArray(templateId) ? templateId[0] : templateId
      await odooWrite('product.template', tmplId as number, {
        name: product.name,
        list_price: price,
        description_sale: descriptionSale || false,
        categ_id: categoryId,
        x_nextjs_id: product.id,
        x_slug: product.slug,
        sale_ok: true,
        purchase_ok: true,
      })
    }
  } else {
    const newProductId = await odooCreate('product.product', {
      default_code: sku,
      name: product.name,
      list_price: price,
      description_sale: descriptionSale || false,
      categ_id: categoryId,
      x_nextjs_id: product.id,
      x_slug: product.slug,
      sale_ok: true,
      purchase_ok: true,
    })
    odooProductId = newProductId
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
    saveProducts(all)
  }
}

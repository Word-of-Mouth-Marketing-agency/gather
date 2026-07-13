import { getOdooConfig, odooSearchRead, odooExecuteKw, isOdooSyncEnabled, getAllowedOdooHosts } from './json-rpc'
import { readJson } from '@/lib/db'
import type { Category, Customer, Product } from '@/types'
import type { Order } from '@/lib/orders'

const REQUIRED_FIELDS = {
  'product.template': ['x_nextjs_id', 'x_slug', 'x_nextjs_category_ids'],
  'product.category': ['x_nextjs_id', 'x_slug'],
  'res.partner': ['x_nextjs_id'],
  'sale.order': ['x_nextjs_id', 'x_nextjs_order_number', 'x_delivery_city_area', 'x_delivery_slot', 'x_payment_method'],
} as Record<string, string[]>

interface FieldStatus {
  field: string
  exists: boolean
}

interface ConnectionStatus {
  ok: boolean
  url: string | null
  hostname: string | null
  db: string | null
  error?: string
  uid?: number
  checkoutAutoSyncEnabled: boolean
  allowedHosts: string[]
}

interface RequiredFieldsStatus {
  allOk: boolean
  models: Record<string, { allOk: boolean; fields: FieldStatus[] }>
}

interface CategoryCounts {
  total: number
  synced: number
  failed: number
  skippedOccasions: number
}

interface ProductCounts {
  total: number
  withSku: number
  synced: number
  failed: number
  missingSku: number
  outOfStock: number
}

interface OrderCounts {
  total: number
  synced: number
  failed: number
  notSynced: number
}

interface CustomerCounts {
  total: number
  synced: number
  failed: number
  notSynced: number
  stalePartnerId: number
  duplicateRisk: number
}

interface StockStatus {
  lastStockPulledAt: string | null
  outOfStockProducts: Array<{ id: string; name: string; sku: string; stock: number }>
}

interface SyncTimestamps {
  categoryLastSyncedAt: string | null
  productLastSyncedAt: string | null
  stockLastPulledAt: string | null
  orderLastSyncedAt: string | null
  customerLastSyncedAt: string | null
}

export interface DiagnosticsResult {
  connection: ConnectionStatus
  requiredFields: RequiredFieldsStatus
  categories: CategoryCounts
  products: ProductCounts
  orders: OrderCounts
  customers: CustomerCounts
  stock: StockStatus
  timestamps: SyncTimestamps
  warnings: string[]
}

export async function getOdooDiagnostics(): Promise<DiagnosticsResult> {
  const config = getOdooConfig()
  const hostname = config?.url ? new URL(config.url).hostname : null
  const result: DiagnosticsResult = {
    connection: {
      ok: false,
      url: config?.url ?? null,
      hostname,
      db: config?.db ?? null,
      checkoutAutoSyncEnabled: isOdooSyncEnabled(),
      allowedHosts: getAllowedOdooHosts(),
    },
    requiredFields: { allOk: false, models: {} },
    categories: { total: 0, synced: 0, failed: 0, skippedOccasions: 0 },
    products: { total: 0, withSku: 0, synced: 0, failed: 0, missingSku: 0, outOfStock: 0 },
    orders: { total: 0, synced: 0, failed: 0, notSynced: 0 },
    customers: { total: 0, synced: 0, failed: 0, notSynced: 0, stalePartnerId: 0, duplicateRisk: 0 },
    stock: { lastStockPulledAt: null, outOfStockProducts: [] },
    timestamps: { categoryLastSyncedAt: null, productLastSyncedAt: null, stockLastPulledAt: null, orderLastSyncedAt: null, customerLastSyncedAt: null },
    warnings: [],
  }

  result.connection = await checkConnection(config)
  if (!result.connection.ok) {
    result.warnings.push(`Odoo connection failed: ${result.connection.error}`)
    return result
  }

  result.requiredFields = await checkRequiredFields()

  const categories = readJson<Category[]>('categories.json')
  const products = readJson<Product[]>('products.json')
  const orders = readJson<Order[]>('orders.json')

  const categoryTypes = categories.filter((c) => c.type === 'category')
  const occasions = categories.filter((c) => c.type === 'occasion')
  result.categories = {
    total: categoryTypes.length,
    synced: categoryTypes.filter((c) => c.syncStatus === 'synced').length,
    failed: categoryTypes.filter((c) => c.syncStatus === 'sync_failed').length,
    skippedOccasions: occasions.length,
  }

  const withSku = products.filter((p) => p.sku?.trim())
  result.products = {
    total: products.length,
    withSku: withSku.length,
    synced: products.filter((p) => p.syncStatus === 'synced').length,
    failed: products.filter((p) => p.syncStatus === 'sync_failed').length,
    missingSku: products.filter((p) => !p.sku?.trim()).length,
    outOfStock: products.filter((p) => p.stockStatus === 'out_of_stock' || (p.stock <= 0)).length,
  }

  result.orders = {
    total: orders.length,
    synced: orders.filter((o) => o.syncStatus === 'synced').length,
    failed: orders.filter((o) => o.syncStatus === 'sync_failed').length,
    notSynced: orders.filter((o) => !o.syncStatus || o.syncStatus === 'not_synced').length,
  }

  const customers = readJson<Customer[]>('customers.json')
  const emailCounts = new Map<string, number>()
  for (const c of customers) {
    const key = c.email.toLowerCase()
    emailCounts.set(key, (emailCounts.get(key) ?? 0) + 1)
  }
  result.customers = {
    total: customers.length,
    synced: customers.filter((c) => c.syncStatus === 'synced').length,
    failed: customers.filter((c) => c.syncStatus === 'sync_failed').length,
    notSynced: customers.filter((c) => !c.syncStatus || c.syncStatus === 'not_synced').length,
    stalePartnerId: customers.filter((c) => c.odooPartnerId && c.syncStatus !== 'synced').length,
    duplicateRisk: Array.from(emailCounts.values()).filter((n) => n > 1).length,
  }

  const outOfStockProducts = products
    .filter((p) => p.stockStatus === 'out_of_stock' || (p.stock <= 0))
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku ?? '', stock: p.stock }))
  result.stock.outOfStockProducts = outOfStockProducts
  result.stock.lastStockPulledAt = findLatestStockPull(products)

  const syncTimes = extractSyncTimestamps(products, categories, orders, customers)
  result.timestamps = syncTimes

  if (withSku.length > 0 && products.filter((p) => p.syncStatus === 'synced').length === 0) {
    result.warnings.push('Products have SKUs but none have been synced to Odoo.')
  }
  if (result.products.synced > 0 && result.categories.synced === 0) {
    result.warnings.push('Products are synced but no categories show as synced — stale mappings may exist.')
  }

  const staleProducts = products.filter((p) => p.odooProductId && p.syncStatus !== 'synced')
  if (staleProducts.length > 0) {
    result.warnings.push(`${staleProducts.length} product(s) have stale odooProductId (${staleProducts.map((p) => p.name).join(', ')}).`)
  }

  if (result.customers.failed > 0) {
    result.warnings.push(`${result.customers.failed} customer(s) have failed sync to Odoo.`)
  }
  if (result.customers.stalePartnerId > 0) {
    result.warnings.push(`${result.customers.stalePartnerId} customer(s) have stale odooPartnerId.`)
  }
  if (result.customers.duplicateRisk > 0) {
    result.warnings.push(`${result.customers.duplicateRisk} customer email(s) appear more than once — duplicate risk.`)
  }

  return result
}

async function checkConnection(config: ReturnType<typeof getOdooConfig>): Promise<ConnectionStatus> {
  if (!config) {
    return {
      ok: false, url: null, hostname: null, db: null,
      checkoutAutoSyncEnabled: isOdooSyncEnabled(),
      allowedHosts: getAllowedOdooHosts(),
      error: 'ODOO_URL, ODOO_DB, ODOO_USERNAME, or ODOO_PASSWORD not set',
    }
  }
  try {
    const uid = await odooExecuteKw<number>('res.partner', 'check_access_rights', ['read'], { raise_exception: false })
    return {
      ok: true, url: config.url, hostname: new URL(config.url).hostname, db: config.db, uid,
      checkoutAutoSyncEnabled: isOdooSyncEnabled(),
      allowedHosts: getAllowedOdooHosts(),
    }
  } catch (err) {
    return {
      ok: false, url: config.url, hostname: new URL(config.url).hostname, db: config.db,
      checkoutAutoSyncEnabled: isOdooSyncEnabled(),
      allowedHosts: getAllowedOdooHosts(),
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

async function checkRequiredFields(): Promise<RequiredFieldsStatus> {
  const allOk: RequiredFieldsStatus = { allOk: true, models: {} }

  for (const [model, fields] of Object.entries(REQUIRED_FIELDS)) {
    try {
      const existing = await odooSearchRead<{ name: string }>(
        'ir.model.fields',
        [['model', '=', model], ['name', 'in', fields]],
        ['name'],
        fields.length,
      )
      const existingNames = new Set(existing.map((f) => f.name as string))
      const fieldStatuses = fields.map((f) => ({ field: f, exists: existingNames.has(f) }))
      const modelOk = fieldStatuses.every((f) => f.exists)
      allOk.models[model] = { allOk: modelOk, fields: fieldStatuses }
      if (!modelOk) allOk.allOk = false
    } catch {
      allOk.models[model] = { allOk: false, fields: fields.map((f) => ({ field: f, exists: false })) }
      allOk.allOk = false
    }
  }

  return allOk
}

function findLatestStockPull(products: Product[]): string | null {
  let latest: string | null = null
  for (const p of products) {
    if (p.lastSyncedAt && p.syncStatus === 'synced' && p.stockStatus) {
      if (!latest || p.lastSyncedAt > latest) latest = p.lastSyncedAt
    }
  }
  return latest
}

function extractSyncTimestamps(
  products: Product[],
  categories: Category[],
  orders: Order[],
  customers: Customer[],
): SyncTimestamps {
  const catLast = categories
    .filter((c) => c.lastSyncedAt)
    .map((c) => c.lastSyncedAt!)
    .sort()
    .pop() ?? null

  const prodLast = products
    .filter((p) => p.lastSyncedAt && p.syncStatus === 'synced')
    .map((p) => p.lastSyncedAt!)
    .sort()
    .pop() ?? null

  const stockLast = findLatestStockPull(products)

  const ordLast = orders
    .filter((o) => o.lastSyncedAt)
    .map((o) => o.lastSyncedAt!)
    .sort()
    .pop() ?? null

  const custLast = customers
    .filter((c) => c.lastSyncedAt && c.syncStatus === 'synced')
    .map((c) => c.lastSyncedAt!)
    .sort()
    .pop() ?? null

  return {
    categoryLastSyncedAt: catLast,
    productLastSyncedAt: prodLast,
    stockLastPulledAt: stockLast,
    orderLastSyncedAt: ordLast,
    customerLastSyncedAt: custLast,
  }
}

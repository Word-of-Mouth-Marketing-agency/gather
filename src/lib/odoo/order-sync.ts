import type { Order } from '@/lib/orders'
import type { Product } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate } from './json-rpc'

const ORDERS_FILE = 'orders.json'
const PRODUCTS_FILE = 'products.json'
const DELIVERY_SKU = 'DELIVERY-FEE'
const DELIVERY_NAME = 'Delivery Fee'

export interface OrderSyncResult {
  created: number
  alreadySynced: number
  failed: number
  warnings: string[]
  errors: Record<string, string>
  timestamp: string
}

function now(): string {
  return new Date().toISOString()
}

function loadOrders(): Order[] {
  return readJson<Order[]>(ORDERS_FILE)
}

function saveOrders(items: Order[]): void {
  writeJson(ORDERS_FILE, items)
}

function loadProducts(): Product[] {
  return readJson<Product[]>(PRODUCTS_FILE)
}

async function findOrCreatePartner(
  customer: Order['customer'],
): Promise<number> {
  const byEmail = await odooSearchRead<{ id: number }>(
    'res.partner',
    [['email', '=ilike', customer.email.trim()]],
    ['id'],
    1,
  )
  if (byEmail.length > 0) return byEmail[0].id

  const phone = customer.phone?.replace(/[\s-]/g, '')
  if (phone) {
    const byPhone = await odooSearchRead<{ id: number }>(
      'res.partner',
      ['|', ['phone', '=', phone], ['mobile', '=', phone]],
      ['id'],
      1,
    )
    if (byPhone.length > 0) return byPhone[0].id
  }

  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || customer.email
  return odooCreate('res.partner', {
    name,
    email: customer.email.trim(),
    phone: phone || false,
  })
}

async function resolveOdooProduct(
  productId: string,
  products: Product[],
): Promise<number | null> {
  const local = products.find((p) => p.id === productId)
  if (!local) return null

  if (local.odooProductId) {
    const existing = await odooSearchRead('product.product', [['id', '=', local.odooProductId]], ['id'], 1)
    if (existing.length > 0) return local.odooProductId
  }

  const sku = local.sku?.trim()
  if (sku) {
    const bySku = await odooSearchRead('product.product', [['default_code', '=', sku]], ['id'], 1)
    if (bySku.length > 0) return bySku[0].id as number
  }

  return null
}

async function ensureDeliveryProduct(): Promise<number> {
  const existing = await odooSearchRead('product.product', [['default_code', '=', DELIVERY_SKU]], ['id'], 1)
  if (existing.length > 0) return existing[0].id as number

  return odooCreate('product.product', {
    default_code: DELIVERY_SKU,
    name: DELIVERY_NAME,
    sale_ok: true,
    purchase_ok: false,
    list_price: 0,
  })
}

export async function syncOrdersToOdoo(): Promise<OrderSyncResult> {
  const config = getOdooConfig()
  if (!config) {
    throw new Error(
      'Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_PASSWORD in your .env.local file.',
    )
  }

  const result: OrderSyncResult = {
    created: 0,
    alreadySynced: 0,
    failed: 0,
    warnings: [],
    errors: {},
    timestamp: now(),
  }

  const allOrders = loadOrders()
  const products = loadProducts()

  for (const order of allOrders) {
    try {
      await syncSingleOrder(order, products, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors[order.id] = message
      result.failed += 1

      const all = loadOrders()
      const idx = all.findIndex((o) => o.id === order.id)
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          syncStatus: 'sync_failed',
          syncError: message.slice(0, 500),
          lastSyncedAt: now(),
        }
        saveOrders(all)
      }
    }
  }

  return result
}

async function syncSingleOrder(
  order: Order,
  products: Product[],
  result: OrderSyncResult,
): Promise<void> {
  if (order.odooOrderId) {
    const existing = await odooSearchRead('sale.order', [['id', '=', order.odooOrderId]], ['id'], 1)
    if (existing.length > 0) {
      result.alreadySynced += 1
      return
    }
  }

  const byNextjsId = await odooSearchRead('sale.order', [['x_nextjs_id', '=', order.id]], ['id'], 1)
  if (byNextjsId.length > 0) {
    const odooId = byNextjsId[0].id as number
    const all = loadOrders()
    const idx = all.findIndex((o) => o.id === order.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], odooOrderId: odooId, syncStatus: 'synced', syncError: undefined, lastSyncedAt: now() }
      saveOrders(all)
    }
    result.alreadySynced += 1
    return
  }

  const byRef = await odooSearchRead('sale.order', [['client_order_ref', '=', order.id]], ['id'], 1)
  if (byRef.length > 0) {
    const odooId = byRef[0].id as number
    const all = loadOrders()
    const idx = all.findIndex((o) => o.id === order.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], odooOrderId: odooId, syncStatus: 'synced', syncError: undefined, lastSyncedAt: now() }
      saveOrders(all)
    }
    result.alreadySynced += 1
    return
  }

  const partnerId = await findOrCreatePartner(order.customer)
  const orderLines: Array<[0, 0, Record<string, unknown>]> = []

  for (const item of order.items) {
    if (item.type === 'bundle') {
      throw new Error(
        `Order ${order.orderNumber}: bundle items cannot be synced. ` +
        `Remove bundles before syncing.`,
      )
    }

    const odooProductId = await resolveOdooProduct(item.productId, products)
    if (!odooProductId) {
      throw new Error(
        `Order ${order.orderNumber}: product "${item.name}" (${item.productId}) not found in Odoo. ` +
        `Sync product "${item.name}" first.`,
      )
    }

    orderLines.push([
      0, 0, {
        product_id: odooProductId,
        name: item.name,
        product_uom_qty: item.quantity,
        price_unit: item.price,
      },
    ])
  }

  const shippingFee = order.shippingFee ?? order.delivery?.shippingFee ?? 0
  if (shippingFee > 0) {
    const deliveryProductId = await ensureDeliveryProduct()
    orderLines.push([
      0, 0, {
        product_id: deliveryProductId,
        name: DELIVERY_NAME,
        product_uom_qty: 1,
        price_unit: shippingFee,
      },
    ])
  }

  const deliveryParts = [
    order.delivery?.city,
    order.delivery?.address,
  ].filter(Boolean).join(', ')

  const noteParts: string[] = []
  if (order.delivery?.date) noteParts.push(`Delivery date: ${order.delivery.date}`)
  if (order.delivery?.slot) noteParts.push(`Slot: ${order.delivery.slot}`)
  if (order.notes) noteParts.push(`Notes: ${order.notes}`)

  const newOrderId = await odooCreate('sale.order', {
    client_order_ref: order.id,
    partner_id: partnerId,
    date_order: order.createdAt,
    order_line: orderLines,
    note: noteParts.join('\n'),
    x_nextjs_id: order.id,
    x_nextjs_order_number: order.orderNumber,
    x_delivery_city_area: deliveryParts || false,
    x_delivery_slot: order.delivery?.slot || false,
    x_payment_method: order.paymentMethod || false,
  })

  const all = loadOrders()
  const idx = all.findIndex((o) => o.id === order.id)
  if (idx >= 0) {
    all[idx] = {
      ...all[idx],
      odooOrderId: newOrderId,
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: now(),
    }
    saveOrders(all)
  }

  result.created += 1
}

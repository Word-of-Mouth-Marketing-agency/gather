import type { Order, OrderStatus } from '@/lib/orders'
import type { Product } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate, odooExecuteKw, logSync } from './json-rpc'

const ORDERS_FILE = 'orders.json'
const PRODUCTS_FILE = 'products.json'
const DELIVERY_SKU = 'DELIVERY-FEE'
const DELIVERY_NAME = 'Delivery Fee'
const DISCOUNT_SKU = 'GATHER-COUPON-DISCOUNT'
const DISCOUNT_NAME = 'Website Coupon Discount'

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

function toOdooDatetime(iso: string | undefined): string {
  if (!iso) {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }
  const d = new Date(iso)
  if (isNaN(d.getTime())) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function loadOrders(): Order[] {
  return readJson<Order[]>(ORDERS_FILE)
}

async function saveOrders(items: Order[]): Promise<void> {
  await writeJson(ORDERS_FILE, items)
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

async function ensureDiscountProduct(): Promise<number> {
  const existing = await odooSearchRead('product.product', [['default_code', '=', DISCOUNT_SKU]], ['id'], 1)
  if (existing.length > 0) return existing[0].id as number
  return odooCreate('product.product', {
    default_code: DISCOUNT_SKU,
    name: DISCOUNT_NAME,
    sale_ok: true,
    purchase_ok: false,
    list_price: 0,
    type: 'service',
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
        await saveOrders(all)
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
      await saveOrders(all)
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
      await saveOrders(all)
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

  const couponDiscount = order.couponDiscount ?? 0
  if (couponDiscount > 0) {
    const discountProductId = await ensureDiscountProduct()
    orderLines.push([
      0, 0, {
        product_id: discountProductId,
        name: `Coupon Discount${order.couponCode ? ` (${order.couponCode})` : ''}`,
        product_uom_qty: 1,
        price_unit: -couponDiscount,
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
    date_order: toOdooDatetime(order.createdAt),
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
    await saveOrders(all)
  }

  result.created += 1
}

// ─── Order Status Sync (Website → Odoo) ────────────────────────────────────

export interface OrderStatusSyncResult {
  action: string
  odooState: string
  syncStatus: 'synced' | 'sync_failed' | 'skipped'
  syncError?: string
  warning?: string
}

const STATUS_TO_ACTION: Partial<Record<OrderStatus, string>> = {
  confirmed: 'action_confirm',
  preparing: 'action_confirm',
  out_for_delivery: 'action_confirm',
  delivered: 'action_confirm',
  cancelled: 'action_cancel',
}

export async function syncOrderStatusToOdoo(orderId: string): Promise<OrderStatusSyncResult> {
  const config = getOdooConfig()
  if (!config) {
    return { action: 'none', odooState: 'unknown', syncStatus: 'skipped', syncError: 'Odoo not configured' }
  }

  const allOrders = loadOrders()
  const order = allOrders.find((o) => o.id === orderId)
  if (!order) {
    return { action: 'none', odooState: 'unknown', syncStatus: 'sync_failed', syncError: 'Order not found locally' }
  }

  const targetAction = STATUS_TO_ACTION[order.status]
  if (!targetAction) {
    return { action: 'none', odooState: 'unknown', syncStatus: 'skipped' }
  }

  const t0 = Date.now()

  try {
    const odooId = await resolveOdooOrderId(order)
    if (!odooId) {
      return { action: 'none', odooState: 'unknown', syncStatus: 'sync_failed', syncError: 'Order not synced to Odoo yet' }
    }

    const current = await odooSearchRead<{ id: number; state: string }>(
      'sale.order',
      [['id', '=', odooId]],
      ['id', 'state'],
      1,
    )
    if (current.length === 0) {
      return { action: 'none', odooState: 'unknown', syncStatus: 'sync_failed', syncError: 'Odoo order not found' }
    }

    const odooState = current[0].state as string

    if (odooState === 'cancel' && targetAction === 'action_confirm') {
      logSync({
        direction: 'push',
        entity: 'order',
        localId: orderId,
        odooId,
        operation: `skip_${targetAction}`,
        durationMs: Date.now() - t0,
        result: 'skipped',
        error: 'Odoo order is cancelled, cannot confirm',
      })
      return {
        action: 'none',
        odooState,
        syncStatus: 'synced',
        warning: 'Odoo order is already cancelled',
      }
    }

    if ((odooState === 'sale' || odooState === 'done') && targetAction === 'action_confirm') {
      logSync({
        direction: 'push',
        entity: 'order',
        localId: orderId,
        odooId,
        operation: 'skip_action_confirm',
        durationMs: Date.now() - t0,
        result: 'skipped',
      })
      return { action: 'none', odooState, syncStatus: 'synced' }
    }

    if (odooState === 'cancel' && targetAction === 'action_cancel') {
      logSync({
        direction: 'push',
        entity: 'order',
        localId: orderId,
        odooId,
        operation: 'skip_action_cancel',
        durationMs: Date.now() - t0,
        result: 'skipped',
      })
      return { action: 'none', odooState, syncStatus: 'synced' }
    }

    await odooExecuteKw('sale.order', targetAction, [[odooId]], {
      context: { gather_sync_origin: 'website' },
    })

    const after = await odooSearchRead<{ id: number; state: string }>(
      'sale.order',
      [['id', '=', odooId]],
      ['id', 'state'],
      1,
    )
    const newState = after.length > 0 ? after[0].state : odooState

    logSync({
      direction: 'push',
      entity: 'order',
      localId: orderId,
      odooId,
      operation: targetAction,
      durationMs: Date.now() - t0,
      result: 'success',
    })

    return { action: targetAction, odooState: newState, syncStatus: 'synced' }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    logSync({
      direction: 'push',
      entity: 'order',
      localId: orderId,
      operation: targetAction,
      durationMs: Date.now() - t0,
      result: 'failed',
      error: message,
    })

    return { action: targetAction, odooState: 'unknown', syncStatus: 'sync_failed', syncError: message }
  }
}

async function resolveOdooOrderId(order: Order): Promise<number | null> {
  if (order.odooOrderId) {
    const found = await odooSearchRead('sale.order', [['id', '=', order.odooOrderId]], ['id'], 1)
    if (found.length > 0) return found[0].id as number
  }

  const byNextjs = await odooSearchRead('sale.order', [['x_nextjs_id', '=', order.id]], ['id'], 1)
  if (byNextjs.length > 0) {
    const odooId = byNextjs[0].id as number
    const all = loadOrders()
    const idx = all.findIndex((o) => o.id === order.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], odooOrderId: odooId, syncStatus: 'synced', syncError: undefined, lastSyncedAt: now() }
      await saveOrders(all)
    }
    return odooId
  }

  const byRef = await odooSearchRead('sale.order', [['client_order_ref', '=', order.id]], ['id'], 1)
  if (byRef.length > 0) {
    const odooId = byRef[0].id as number
    const all = loadOrders()
    const idx = all.findIndex((o) => o.id === order.id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], odooOrderId: odooId, syncStatus: 'synced', syncError: undefined, lastSyncedAt: now() }
      await saveOrders(all)
    }
    return odooId
  }

  return null
}

export async function syncOrderAfterCheckout(orderId: string): Promise<void> {
  const config = getOdooConfig()
  if (!config) return

  try {
    const allOrders = loadOrders()
    const order = allOrders.find((o) => o.id === orderId)
    if (!order) return

    const fakeResult: OrderSyncResult = {
      created: 0, alreadySynced: 0, failed: 0, warnings: [], errors: {}, timestamp: now(),
    }
    const products = loadProducts()

    await syncSingleOrder(order, products, fakeResult)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const all = loadOrders()
    const idx = all.findIndex((o) => o.id === orderId)
    if (idx >= 0) {
      all[idx] = {
        ...all[idx],
        syncStatus: 'sync_failed',
        syncError: message.slice(0, 500),
        lastSyncedAt: now(),
      }
      await saveOrders(all)
    }
  }
}

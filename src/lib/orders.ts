import { readJson, writeJson, generateId, withLock, acquireLock, releaseLock } from './db'

export type OrderItem =
  | { type: 'product'; productId: string; name: string; price: number; quantity: number }
  | { type: 'bundle'; bundleId: string; name: string; price: number; quantity: number; productIds: string[] }

export type EmailStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  shippingFee?: number
  total: number
  currency: string
  customerId?: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  delivery: {
    city: string
    address: string
    date: string
    slot: string
    shippingFee?: number
  }
  paymentMethod: string
  notes: string
  acceptedPrivacyPolicy: boolean
  acceptedRefundPolicy: boolean
  acceptedPoliciesAt: string
  status: OrderStatus
  createdAt: string
  updatedAt?: string
  odooOrderId?: number
  syncStatus?: 'not_synced' | 'synced' | 'sync_failed'
  syncError?: string
  lastSyncedAt?: string
  adminEmailStatus?: EmailStatus
  customerEmailStatus?: EmailStatus
  adminEmailSentAt?: string
  customerEmailSentAt?: string
  emailLastError?: string
  emailLastAttemptAt?: string
}

const ORDERS_FILE = 'orders.json'

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

export function isOrderStatus(status: string): status is OrderStatus {
  return ORDER_STATUSES.includes(status as OrderStatus)
}

export function getAllOrders(): Order[] {
  try {
    return readJson<Order[]>(ORDERS_FILE)
  } catch {
    return []
  }
}

export function getOrderById(id: string): Order | undefined {
  return getAllOrders().find((o) => o.id === id)
}

export function createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'status' | 'createdAt'>): Order {
  return withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const now = new Date().toISOString()
    const order: Order = {
      ...data,
      id: generateId('ord'),
      orderNumber: `GATHER-${Date.now().toString(36).toUpperCase()}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    }
    orders.push(order)
    writeJson(ORDERS_FILE, orders)
    return order
  })
}

export function updateOrderStatus(id: string, status: Order['status']): Order | undefined {
  if (!isOrderStatus(status)) return undefined
  return withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return undefined
    orders[idx].status = status
    orders[idx].updatedAt = new Date().toISOString()
    writeJson(ORDERS_FILE, orders)
    return orders[idx]
  })
}

export function deleteOrder(id: string): boolean {
  return withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return false
    orders.splice(idx, 1)
    writeJson(ORDERS_FILE, orders)
    return true
  })
}

const EMAIL_SENDING_TIMEOUT_MS = 60_000

export function reserveAdminEmail(id: string): boolean {
  return withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return false
    const o = orders[idx]
    if (o.adminEmailStatus === 'sent') return false
    if (o.adminEmailStatus === 'sending') {
      const lastAttempt = o.emailLastAttemptAt ? Date.now() - new Date(o.emailLastAttemptAt).getTime() : 0
      if (lastAttempt < EMAIL_SENDING_TIMEOUT_MS) return false
    }
    o.adminEmailStatus = 'sending'
    o.emailLastAttemptAt = new Date().toISOString()
    writeJson(ORDERS_FILE, orders)
    return true
  })
}

export function reserveCustomerEmail(id: string): boolean {
  return withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return false
    const o = orders[idx]
    if (o.customerEmailStatus === 'sent') return false
    if (o.customerEmailStatus === 'sending') {
      const lastAttempt = o.emailLastAttemptAt ? Date.now() - new Date(o.emailLastAttemptAt).getTime() : 0
      if (lastAttempt < EMAIL_SENDING_TIMEOUT_MS) return false
    }
    o.customerEmailStatus = 'sending'
    o.emailLastAttemptAt = new Date().toISOString()
    writeJson(ORDERS_FILE, orders)
    return true
  })
}

export function commitAdminEmailSent(id: string): void {
  withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return
    orders[idx].adminEmailStatus = 'sent'
    orders[idx].adminEmailSentAt = new Date().toISOString()
    orders[idx].emailLastAttemptAt = new Date().toISOString()
    orders[idx].emailLastError = undefined
    writeJson(ORDERS_FILE, orders)
  })
}

export function commitCustomerEmailSent(id: string): void {
  withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return
    orders[idx].customerEmailStatus = 'sent'
    orders[idx].customerEmailSentAt = new Date().toISOString()
    orders[idx].emailLastAttemptAt = new Date().toISOString()
    orders[idx].emailLastError = undefined
    writeJson(ORDERS_FILE, orders)
  })
}

export function markEmailFailed(id: string, error: string): void {
  withLock(ORDERS_FILE, () => {
    const orders = readJson<Order[]>(ORDERS_FILE)
    const idx = orders.findIndex((o) => o.id === id)
    if (idx < 0) return
    const o = orders[idx]
    if (o.adminEmailStatus === 'sending') o.adminEmailStatus = 'failed'
    if (o.customerEmailStatus === 'sending') o.customerEmailStatus = 'failed'
    o.emailLastError = error.slice(0, 500)
    o.emailLastAttemptAt = new Date().toISOString()
    writeJson(ORDERS_FILE, orders)
  })
}

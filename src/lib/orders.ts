import { readJson, writeJson, generateId } from './db'

export type OrderItem =
  | { type: 'product'; productId: string; name: string; price: number; quantity: number }
  | { type: 'bundle'; bundleId: string; name: string; price: number; quantity: number; productIds: string[] }

export interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  total: number
  currency: string
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
  }
  paymentMethod: string
  notes: string
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  createdAt: string
}

const ORDERS_FILE = 'orders.json'

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
  const orders = getAllOrders()
  const order: Order = {
    ...data,
    id: generateId('ord'),
    orderNumber: `GATHER-${Date.now().toString(36).toUpperCase()}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  orders.push(order)
  writeJson(ORDERS_FILE, orders)
  return order
}

export function updateOrderStatus(id: string, status: Order['status']): Order | undefined {
  const orders = getAllOrders()
  const idx = orders.findIndex((o) => o.id === id)
  if (idx < 0) return undefined
  orders[idx].status = status
  writeJson(ORDERS_FILE, orders)
  return orders[idx]
}

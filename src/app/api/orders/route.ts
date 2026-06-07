import { NextResponse } from 'next/server'
import { getAllOrders, createOrder, updateOrderStatus } from '@/lib/orders'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  let orders = getAllOrders()
  if (email) {
    orders = orders.filter((o) => o.customer.email.toLowerCase() === email.toLowerCase())
  }
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const order = createOrder(data)
    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json()
    const updated = updateOrderStatus(id, status)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

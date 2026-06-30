import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getAllOrders, createOrder, updateOrderStatus } from '@/lib/orders'
import { getShippingFeeForCity } from '@/lib/shipping-fees'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  if (!email) {
    const unauthorized = await requireAdminApi()
    if (unauthorized) return unauthorized
  }
  let orders = getAllOrders()
  if (email) {
    orders = orders.filter((o) => o.customer.email.toLowerCase() === email.toLowerCase())
  }
  return NextResponse.json(orders)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const shippingFee = getShippingFeeForCity(data.delivery?.city ?? '')
    const subtotal = Number(data.subtotal) || 0
    const order = createOrder({
      ...data,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      delivery: {
        ...data.delivery,
        shippingFee,
      },
    })
    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id, status } = await request.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }
    const updated = updateOrderStatus(id, status)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

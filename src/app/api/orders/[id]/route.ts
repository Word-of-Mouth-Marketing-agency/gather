import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { deleteOrder, getOrderById, updateOrderStatus } from '@/lib/orders'
import { syncOrderStatusToOdoo } from '@/lib/odoo/order-sync'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['orders.read'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const order = getOrderById(id)
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(order)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['orders.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const { status } = await request.json()
    if (!status) return NextResponse.json({ error: 'Status required' }, { status: 400 })
    const updated = await updateOrderStatus(id, status)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    syncOrderStatusToOdoo(id).catch((err) => {
      console.error(`[ORDER_STATUS_SYNC] ${id} failed:`, err)
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['orders.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const deleted = await deleteOrder(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

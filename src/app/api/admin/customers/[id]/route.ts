import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { deleteCustomer, getAdminCustomerById, updateCustomer } from '@/lib/customer-data'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncPartnerFromCustomer } from '@/lib/odoo/partner-sync'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['customers.read'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const customer = getAdminCustomerById(id)
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['customers.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const data = await request.json()
    const updated = await updateCustomer(id, {
      name: data.name,
      email: data.email,
      phone: data.phone,
      isActive: data.isActive,
      status: data.status,
    })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (isOdooSyncEnabled()) {
      syncPartnerFromCustomer(id)
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      addresses: updated.addresses,
      isActive: updated.isActive !== false && updated.status !== 'disabled',
      status: updated.isActive !== false && updated.status !== 'disabled' ? 'active' : 'disabled',
      createdAt: updated.createdAt,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['customers.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const deleted = await deleteCustomer(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ success: true })
}

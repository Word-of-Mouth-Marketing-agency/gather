import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getAdminCustomers, updateCustomer } from '@/lib/customer-data'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncPartnerFromCustomer } from '@/lib/odoo/partner-sync'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  return NextResponse.json(getAdminCustomers())
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id, name, email, phone, isActive, status } = await request.json()
    if (!id) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })

    const updated = updateCustomer(id, { name, email, phone, isActive, status })
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

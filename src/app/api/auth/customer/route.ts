import { NextResponse } from 'next/server'
import { customerIsActive, findCustomerById, updateCustomer } from '@/lib/customer-data'
import { getCustomerSessionCookie } from '@/lib/customer-session'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncPartnerFromCustomer } from '@/lib/odoo/partner-sync'

async function requireCustomerId(request: Request): Promise<NextResponse | string> {
  const session = await getCustomerSessionCookie()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const queryId = searchParams.get('id')
  if (queryId && queryId !== session.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return session.id
}

export async function GET(request: Request) {
  const customerId = await requireCustomerId(request)
  if (typeof customerId !== 'string') return customerId

  const customer = findCustomerById(customerId)
  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!customerIsActive(customer)) {
    return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
  }
  return NextResponse.json({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    addresses: customer.addresses,
  })
}

export async function PUT(request: Request) {
  const customerId = await requireCustomerId(request)
  if (typeof customerId !== 'string') return customerId

  try {
    const data = await request.json()
    const customer = findCustomerById(customerId)
    if (!customer) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!customerIsActive(customer)) {
      return NextResponse.json({ error: 'Account disabled' }, { status: 403 })
    }
    const updated = await updateCustomer(customerId, {
      name: data.name,
      email: data.email,
      phone: data.phone,
    })
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (isOdooSyncEnabled()) {
      syncPartnerFromCustomer(customerId)
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

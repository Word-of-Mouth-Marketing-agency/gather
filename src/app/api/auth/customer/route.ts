import { NextResponse } from 'next/server'
import { findCustomerById, updateCustomer } from '@/lib/customer-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
  }
  const customer = findCustomerById(id)
  if (!customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }
    const data = await request.json()
    const updated = updateCustomer(id, data)
    if (!updated) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
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

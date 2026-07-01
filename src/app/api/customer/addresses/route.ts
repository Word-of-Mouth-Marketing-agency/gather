import { NextResponse } from 'next/server'
import { getCustomerAddresses, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from '@/lib/customer-data'
import { getCustomerSessionCookie } from '@/lib/customer-session'

async function requireCustomerId(): Promise<NextResponse | string> {
  const session = await getCustomerSessionCookie()
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return session.id
}

export async function GET(request: Request) {
  const customerId = await requireCustomerId()
  if (typeof customerId !== 'string') return customerId
  const addresses = getCustomerAddresses(customerId)
  return NextResponse.json(addresses)
}

export async function POST(request: Request) {
  const customerId = await requireCustomerId()
  if (typeof customerId !== 'string') return customerId
  try {
    const data = await request.json()
    const address = addCustomerAddress(customerId, data)
    if (!address) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }
    return NextResponse.json(address, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  const customerId = await requireCustomerId()
  if (typeof customerId !== 'string') return customerId
  try {
    const { addressId, ...data } = await request.json()
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }
    const updated = updateCustomerAddress(customerId, addressId, data)
    if (!updated) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  const customerId = await requireCustomerId()
  if (typeof customerId !== 'string') return customerId
  try {
    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('addressId')
    if (!addressId) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }
    const deleted = deleteCustomerAddress(customerId, addressId)
    if (!deleted) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

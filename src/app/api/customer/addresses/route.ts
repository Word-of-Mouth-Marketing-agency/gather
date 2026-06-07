import { NextResponse } from 'next/server'
import { getCustomerAddresses, addCustomerAddress, updateCustomerAddress, deleteCustomerAddress } from '@/lib/customer-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')
  if (!customerId) {
    return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
  }
  const addresses = getCustomerAddresses(customerId)
  return NextResponse.json(addresses)
}

export async function POST(request: Request) {
  try {
    const { customerId, ...data } = await request.json()
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }
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
  try {
    const { customerId, addressId, ...data } = await request.json()
    if (!customerId || !addressId) {
      return NextResponse.json({ error: 'Customer ID and Address ID required' }, { status: 400 })
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
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const addressId = searchParams.get('addressId')
    if (!customerId || !addressId) {
      return NextResponse.json({ error: 'Customer ID and Address ID required' }, { status: 400 })
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

import { NextResponse } from 'next/server'
import { findCustomerByEmail, createCustomer } from '@/lib/customer-data'

export async function POST(request: Request) {
  try {
    const { name, email, phone, password } = await request.json()

    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = findCustomerByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const customer = createCustomer({ name, email, phone, password })

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

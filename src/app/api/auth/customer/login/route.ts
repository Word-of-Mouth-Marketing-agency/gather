import { NextResponse } from 'next/server'
import { findCustomerByEmail } from '@/lib/customer-data'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const customer = findCustomerByEmail(email)
    if (!customer || customer.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

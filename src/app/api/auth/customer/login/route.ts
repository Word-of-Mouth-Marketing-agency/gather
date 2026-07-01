import { NextResponse } from 'next/server'
import { customerIsActive, verifyCustomerPassword } from '@/lib/customer-data'
import { setCustomerSessionCookie } from '@/lib/customer-session'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const customer = verifyCustomerPassword(email, password)
    if (!customer) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!customerIsActive(customer)) {
      return NextResponse.json({ error: 'This account has been disabled' }, { status: 403 })
    }

    await setCustomerSessionCookie({ id: customer.id, email: customer.email, name: customer.name })

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
    })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

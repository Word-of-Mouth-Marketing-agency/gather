import { NextResponse } from 'next/server'
import { clearCustomerSessionCookie } from '@/lib/customer-session'

export async function POST() {
  try {
    await clearCustomerSessionCookie()
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { resetPasswordWithToken } from '@/lib/customer-data'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const success = resetPasswordWithToken(token, password)
    if (!success) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

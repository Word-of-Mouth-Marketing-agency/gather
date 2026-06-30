import { NextResponse } from 'next/server'
import { generatePasswordResetToken } from '@/lib/customer-data'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
    }

    const token = generatePasswordResetToken(email)
    if (token && process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        message: 'If the email exists, a reset link has been generated.',
        devToken: token,
      })
    }

    return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
  } catch {
    return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
  }
}

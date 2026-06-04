import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('[Contact Form]', body)
    return NextResponse.json({ success: true, message: 'Message sent successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

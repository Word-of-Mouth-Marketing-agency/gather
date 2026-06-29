import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, message, recipientEmail } = body

    // TODO: Wire this to a real email service (SendGrid, Resend, etc.)
    // For now, log the submission with the configured recipient email.
    console.log('[Contact Form]', {
      to: recipientEmail || 'info@gather-eg.com',
      from: email,
      name,
      message,
    })

    return NextResponse.json({ success: true, message: 'Message sent successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
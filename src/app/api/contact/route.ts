import { NextResponse } from 'next/server'
import { sendAdminNotification } from '@/lib/mail'
import { rateLimit } from '@/lib/rate-limit'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 5 })
  if (!rl.ok) return rl.response

  try {
    const body = await request.json()
    const { name, email, message, recipientEmail } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!email || typeof email !== 'string' || !validateEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const safeName = escapeHtml(name.trim())
    const safeEmail = escapeHtml(email.trim())
    const safeMessage = escapeHtml(message.trim())

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'short',
    })

    const textBody = [
      `Form: Contact Form`,
      `Customer: ${safeName}`,
      `Email: ${safeEmail}`,
      `Timestamp: ${timestamp}`,
      `Source: /contact`,
      ``,
      `Message:`,
      safeMessage,
    ].join('\n')

    const htmlBody = [
      '<table style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:600px">',
      '<tr><td style="padding:12px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Form</td><td style="padding:12px;border:1px solid #ddd">Contact Form</td></tr>',
      `<tr><td style="padding:12px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Customer</td><td style="padding:12px;border:1px solid #ddd">${safeName}</td></tr>`,
      `<tr><td style="padding:12px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Email</td><td style="padding:12px;border:1px solid #ddd">${safeEmail}</td></tr>`,
      `<tr><td style="padding:12px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Timestamp</td><td style="padding:12px;border:1px solid #ddd">${timestamp}</td></tr>`,
      `<tr><td style="padding:12px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Source</td><td style="padding:12px;border:1px solid #ddd">/contact</td></tr>`,
      `<tr><td style="padding:12px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Message</td><td style="padding:12px;border:1px solid #ddd;white-space:pre-wrap">${safeMessage}</td></tr>`,
      '</table>',
    ].join('\n')

    const sent = await sendAdminNotification({
      subject: `[Gather Contact] ${safeName}`,
      text: textBody,
      html: htmlBody,
      replyTo: email.trim(),
    })

    if (!sent) {
      console.warn('[Contact Form] email backend not configured — logged only')
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

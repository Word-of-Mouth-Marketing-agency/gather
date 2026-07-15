import { NextResponse } from 'next/server'
import { generatePasswordResetToken } from '@/lib/customer-data'
import { sendMail } from '@/lib/mail'
import { getSiteUrl } from '@/lib/site-url'
import { rateLimit, rateLimitByKey } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 5 })
  if (!rl.ok) return rl.response

  try {
    const { email } = await request.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
    }
    if (!rateLimitByKey(`forgot:${(email as string).toLowerCase()}`, { windowMs: 300_000, maxRequests: 3 }).ok) {
      return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
    }

    const token = await generatePasswordResetToken(email)
    if (token) {
      const siteUrl = getSiteUrl()
      const resetLink = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

      await sendMail({
        to: email,
        subject: 'Reset your Gather password',
        text: `You requested a password reset.\n\nClick this link to reset your password:\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nGather`,
        html: `<div style="font-family:sans-serif;max-width:480px"><h2 style="color:#ff7a1a">Reset your password</h2><p>Click the button below to reset your Gather password.</p><p><a href="${resetLink}" style="background:#ff7a1a;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0">Reset Password</a></p><p style="color:#666;font-size:0.85em">If you did not request this, please ignore this email.</p><hr style="border:none;border-top:1px solid #eee"><p style="color:#999;font-size:0.8em">Gather</p></div>`,
      })
    }

    return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
  } catch {
    return NextResponse.json({ message: 'If the email exists, a reset link will be sent.' }, { status: 200 })
  }
}

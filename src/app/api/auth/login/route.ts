import { NextResponse } from 'next/server'
import { setSession } from '@/lib/auth'
import { verifyAdminLogin, bootstrapInitialAdmin, isAdminUsersEmpty } from '@/lib/admin-users'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 10 })
  if (!rl.ok) return rl.response

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (isAdminUsersEmpty()) {
      const envEmail = process.env.ADMIN_EMAIL
      const envPassword = process.env.ADMIN_PASSWORD
      if (envEmail && envPassword && email.toLowerCase().trim() === envEmail.toLowerCase().trim() && password === envPassword) {
        const admin = await bootstrapInitialAdmin(envEmail, envPassword, 'Super Admin')
        await setSession(admin.id, admin.email, admin.role)
        return NextResponse.json({ success: true })
      }
    }

    const admin = await verifyAdminLogin(email, password)
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setSession(admin.id, admin.email, admin.role)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

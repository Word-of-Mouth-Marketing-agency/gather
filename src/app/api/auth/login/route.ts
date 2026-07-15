import { NextResponse } from 'next/server'
import { validateCredentials, setSession } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 10 })
  if (!rl.ok) return rl.response

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    if (!validateCredentials(email, password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await setSession(email)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

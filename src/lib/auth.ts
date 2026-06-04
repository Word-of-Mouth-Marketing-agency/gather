import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const SESSION_COOKIE = 'gather_admin_session'
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

function getCredentials(): { email: string; password: string } {
  return {
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_PASSWORD || '',
  }
}

export function validateCredentials(email: string, password: string): boolean {
  const creds = getCredentials()
  return email === creds.email && password === creds.password
}

export function createSessionToken(email: string): string {
  const payload = { email, exp: Date.now() + SESSION_EXPIRY_MS }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

export function parseSessionToken(token: string): { email: string; exp: number } | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export async function getSession(): Promise<{ email: string } | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = parseSessionToken(token)
  if (!payload || payload.exp < Date.now()) return null
  return { email: payload.email }
}

export async function setSession(email: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, createSessionToken(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export async function requireAdmin() {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}

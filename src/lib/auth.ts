import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminSessionToken, parseAdminSessionToken } from './admin-session'

const SESSION_COOKIE = 'gather_admin_session'

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

export async function getSession(): Promise<{ email: string; role: string } | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await parseAdminSessionToken(token)
  if (!payload) return null
  return { email: payload.email, role: payload.role }
}

export async function setSession(email: string) {
  const store = await cookies()
  store.set(SESSION_COOKIE, await createAdminSessionToken(email), {
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

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createAdminSessionToken, parseAdminSessionToken } from './admin-session'
import { getAdminByEmail } from './admin-users'
import type { Role } from './permissions'

const SESSION_COOKIE = 'gather_admin_session'

export type AdminSession = {
  adminUserId: string
  email: string
  role: Role
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const payload = await parseAdminSessionToken(token)
  if (!payload) return null

  const admin = getAdminByEmail(payload.email)
  if (!admin || !admin.isActive) return null
  if (admin.role !== payload.role) return null

  return { adminUserId: admin.id, email: admin.email, role: admin.role }
}

export async function setSession(adminUserId: string, email: string, role: Role) {
  const store = await cookies()
  store.set(SESSION_COOKIE, await createAdminSessionToken(adminUserId, email, role), {
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

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}

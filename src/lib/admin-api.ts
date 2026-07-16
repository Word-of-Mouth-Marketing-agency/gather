import { NextResponse } from 'next/server'
import { getSession } from './auth'
import { hasPermission, hasAnyPermission } from './permissions'
import type { AdminSession } from './auth'
import type { Permission, Role } from './permissions'

export type { AdminSession }

export async function requireAdminApi(): Promise<NextResponse | null> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }
    return null
  } catch {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
  }
}

async function getAdminSessionOrUnauthorized(): Promise<AdminSession | null> {
  try {
    return await getSession()
  } catch {
    return null
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return getAdminSessionOrUnauthorized()
}

export async function requireAdminPermission(
  permission: Permission,
): Promise<{ session: AdminSession } | NextResponse> {
  const session = await getAdminSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
  }
  if (!hasPermission(session.role, permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { session }
}

export async function requireAnyAdminPermission(
  permissions: Permission[],
): Promise<{ session: AdminSession } | NextResponse> {
  const session = await getAdminSessionOrUnauthorized()
  if (!session) {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
  }
  if (!hasAnyPermission(session.role, permissions)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return { session }
}

export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function apiForbidden(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

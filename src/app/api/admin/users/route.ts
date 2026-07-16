import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/lib/admin-api'
import { getAllAdmins, createAdmin, getSafeAdminById } from '@/lib/admin-users'
import { recordAuditEvent } from '@/lib/audit-log'
import type { Role } from '@/lib/permissions'

export async function GET() {
  const auth = await requireAdminPermission('admin_users.manage')
  if (auth instanceof NextResponse) return auth

  const admins = getAllAdmins()
  return NextResponse.json(admins)
}

export async function POST(request: Request) {
  const auth = await requireAdminPermission('admin_users.manage')
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    const validRoles: Role[] = ['super_admin', 'marketing_admin', 'finance_admin']
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const admin = await createAdmin({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      createdBy: auth.session.adminUserId,
    })

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'admin.created',
      targetType: 'admin',
      targetId: admin.id,
      metadata: { createdEmail: admin.email, role: admin.role },
    })

    return NextResponse.json(admin, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid data'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

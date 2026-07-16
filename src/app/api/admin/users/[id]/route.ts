import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/lib/admin-api'
import { getSafeAdminById, updateAdmin, deleteAdmin, changePassword, countActiveSuperAdmins } from '@/lib/admin-users'
import { recordAuditEvent } from '@/lib/audit-log'
import type { Role } from '@/lib/permissions'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPermission('admin_users.manage')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const admin = getSafeAdminById(id)
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(admin)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPermission('admin_users.manage')
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await request.json()
    const updates: { name?: string; email?: string; role?: Role; isActive?: boolean } = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
      updates.email = body.email
    }
    if (body.role !== undefined) {
      const validRoles: Role[] = ['super_admin', 'marketing_admin', 'finance_admin']
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
      }
      updates.role = body.role
    }

    if (body.isActive === false) {
      const target = getSafeAdminById(id)
      if (target && target.role === 'super_admin') {
        const remaining = countActiveSuperAdmins()
        if (remaining <= 1) {
          return NextResponse.json({ error: 'Cannot deactivate the last active super admin' }, { status: 400 })
        }
      }
      updates.isActive = false
    } else if (body.isActive === true) {
      updates.isActive = true
    }

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
      await changePassword(id, body.password)
      await recordAuditEvent({
        adminUserId: auth.session.adminUserId,
        adminEmail: auth.session.email,
        adminRole: auth.session.role,
        action: 'admin.password_reset',
        targetType: 'admin',
        targetId: id,
      })
    }

    const updated = await updateAdmin(id, updates, auth.session.adminUserId)

    const changedFields = Object.keys(updates)
    if (changedFields.length > 0) {
      await recordAuditEvent({
        adminUserId: auth.session.adminUserId,
        adminEmail: auth.session.email,
        adminRole: auth.session.role,
        action: 'admin.updated',
        targetType: 'admin',
        targetId: id,
        metadata: { changes: changedFields.join(',') },
      })
    }

    return NextResponse.json(updated)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid data'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminPermission('admin_users.manage')
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    await deleteAdmin(id, auth.session.adminUserId)

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'admin.deleted',
      targetType: 'admin',
      targetId: id,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

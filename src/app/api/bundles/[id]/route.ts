import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { getBundleRepository } from '@/lib/repositories'
import { recordAuditEvent } from '@/lib/audit-log'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = getBundleRepository()
  const item = repo.getById(id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['bundles.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const data = await request.json()
  if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
    return NextResponse.json({ error: 'Offer end date cannot be before start date' }, { status: 400 })
  }
  if (Array.isArray(data.productIds)) {
    data.productIds = [...new Set(data.productIds)]
  }
  const repo = getBundleRepository()
  const updated = await repo.update(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await recordAuditEvent({
    adminUserId: auth.session.adminUserId,
    adminEmail: auth.session.email,
    adminRole: auth.session.role,
    action: 'bundle.updated',
    targetType: 'bundle',
    targetId: id,
    metadata: { changedFields: Object.keys(data).join(',') },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['bundles.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const repo = getBundleRepository()
  const deleted = await repo.delete(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await recordAuditEvent({
    adminUserId: auth.session.adminUserId,
    adminEmail: auth.session.email,
    adminRole: auth.session.role,
    action: 'bundle.deleted',
    targetType: 'bundle',
    targetId: id,
  })

  return NextResponse.json({ success: true })
}

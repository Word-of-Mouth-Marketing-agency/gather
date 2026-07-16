import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { deleteShippingFee, getShippingFeeById, updateShippingFee } from '@/lib/shipping-fees'
import { recordAuditEvent } from '@/lib/audit-log'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = getShippingFeeById(id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['shipping.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const data = await request.json()
  const updated = await updateShippingFee(id, data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await recordAuditEvent({
    adminUserId: auth.session.adminUserId,
    adminEmail: auth.session.email,
    adminRole: auth.session.role,
    action: 'shipping.updated',
    targetType: 'shipping',
    targetId: id,
    metadata: { changes: Object.keys(data).join(',') },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['shipping.write'])
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const deleted = await deleteShippingFee(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await recordAuditEvent({
    adminUserId: auth.session.adminUserId,
    adminEmail: auth.session.email,
    adminRole: auth.session.role,
    action: 'shipping.deleted',
    targetType: 'shipping',
    targetId: id,
  })

  return NextResponse.json({ success: true })
}

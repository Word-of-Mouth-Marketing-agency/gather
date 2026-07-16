import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { getCouponById, updateCoupon, deleteCoupon, isCodeTaken } from '@/lib/coupons'
import { recordAuditEvent } from '@/lib/audit-log'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['coupons.read'])
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const coupon = getCouponById(id)
  if (!coupon) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(coupon)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['coupons.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const data = await request.json()

    if (data.code && typeof data.code === 'string') {
      if (isCodeTaken(data.code, id)) {
        return NextResponse.json({ error: 'A coupon with this code already exists', field: 'code' }, { status: 409 })
      }
    }

    if (data.discountType === 'percentage' && data.discountValue !== undefined) {
      const val = Number(data.discountValue)
      if (val <= 0 || val > 100) {
        return NextResponse.json({ error: 'Percentage discount must be between 1 and 100', field: 'discountValue' }, { status: 400 })
      }
    }

    const updated = await updateCoupon(id, data)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'coupon.updated',
      targetType: 'coupon',
      targetId: id,
      metadata: { changes: Object.keys(data).join(',') },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAnyAdminPermission(['coupons.write'])
  if (auth instanceof NextResponse) return auth
  const { id } = await params
  const deleted = await deleteCoupon(id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await recordAuditEvent({
    adminUserId: auth.session.adminUserId,
    adminEmail: auth.session.email,
    adminRole: auth.session.role,
    action: 'coupon.deleted',
    targetType: 'coupon',
    targetId: id,
  })

  return NextResponse.json({ success: true })
}

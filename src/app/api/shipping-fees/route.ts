import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { createShippingFee, getAllShippingFees, getActiveShippingFees } from '@/lib/shipping-fees'
import { recordAuditEvent } from '@/lib/audit-log'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'
  return NextResponse.json(activeOnly ? getActiveShippingFees() : getAllShippingFees())
}

export async function POST(request: Request) {
  const auth = await requireAnyAdminPermission(['shipping.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const data = await request.json()
    const item = await createShippingFee(data)

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'shipping.created',
      targetType: 'shipping',
      targetId: item.id,
      metadata: { city: item.city, fee: item.fee },
    })

    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

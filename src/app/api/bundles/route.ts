import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { getBundleRepository } from '@/lib/repositories'
import { hasPermission } from '@/lib/permissions'
import { recordAuditEvent } from '@/lib/audit-log'

export async function GET() {
  const repo = getBundleRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  const auth = await requireAnyAdminPermission(['bundles.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const data = await request.json()
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      return NextResponse.json({ error: 'Offer end date cannot be before start date' }, { status: 400 })
    }
    if (Array.isArray(data.productIds)) {
      data.productIds = [...new Set(data.productIds)]
    }
    const repo = getBundleRepository()
    const item = await repo.create(data)

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'bundle.created',
      targetType: 'bundle',
      targetId: item.id,
      metadata: { name: item.name, offerPrice: item.offerPrice },
    })

    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

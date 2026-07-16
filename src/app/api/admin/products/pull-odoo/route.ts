import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { pullProductsFromOdoo } from '@/lib/odoo/product-pull'
import { recordAuditEvent } from '@/lib/audit-log'

export async function POST() {
  const auth = await requireAnyAdminPermission(['odoo.manage'])
  if (auth instanceof NextResponse) return auth

  try {
    const result = await pullProductsFromOdoo()

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'odoo.products_pull',
      targetType: 'odoo',
      metadata: { updated: result.updated, failed: result.failed } as Record<string, unknown>,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

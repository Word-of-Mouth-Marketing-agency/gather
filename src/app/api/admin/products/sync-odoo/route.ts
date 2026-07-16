import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { syncProductsToOdoo } from '@/lib/odoo/product-sync'
import { recordAuditEvent } from '@/lib/audit-log'

export async function POST() {
  const auth = await requireAnyAdminPermission(['odoo.manage'])
  if (auth instanceof NextResponse) return auth

  try {
    const result = await syncProductsToOdoo()

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'odoo.products_sync',
      targetType: 'odoo',
      metadata: { created: result.created, updated: result.updated, failed: result.failed } as Record<string, unknown>,
    })

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { syncOrdersToOdoo } from '@/lib/odoo/order-sync'

export async function POST() {
  const auth = await requireAnyAdminPermission(['odoo.manage'])
  if (auth instanceof NextResponse) return auth

  try {
    const result = await syncOrdersToOdoo()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

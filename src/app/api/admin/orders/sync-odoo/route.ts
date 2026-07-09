import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { syncOrdersToOdoo } from '@/lib/odoo/order-sync'

export async function POST() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const result = await syncOrdersToOdoo()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

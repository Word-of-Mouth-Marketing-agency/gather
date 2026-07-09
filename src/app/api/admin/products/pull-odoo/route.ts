import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { pullProductsFromOdoo } from '@/lib/odoo/product-pull'

export async function POST() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const result = await pullProductsFromOdoo()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

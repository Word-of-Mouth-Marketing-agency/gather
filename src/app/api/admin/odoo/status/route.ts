import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getOdooDiagnostics } from '@/lib/odoo/diagnostics'

export async function GET() {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const result = await getOdooDiagnostics()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

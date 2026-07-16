import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { getOdooDiagnostics } from '@/lib/odoo/diagnostics'

export async function GET() {
  const auth = await requireAnyAdminPermission(['odoo.read'])
  if (auth instanceof NextResponse) return auth

  try {
    const result = await getOdooDiagnostics()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

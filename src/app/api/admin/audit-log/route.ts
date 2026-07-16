import { NextResponse } from 'next/server'
import { requireAdminPermission } from '@/lib/admin-api'
import { getAuditLog } from '@/lib/audit-log'

export async function GET(request: Request) {
  const auth = await requireAdminPermission('audit.view')
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined
  const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined
  const adminUserId = searchParams.get('adminUserId') || undefined
  const action = searchParams.get('action') || undefined
  const targetType = searchParams.get('targetType') || undefined

  const entries = getAuditLog({ limit, offset, adminUserId, action, targetType })
  return NextResponse.json(entries)
}

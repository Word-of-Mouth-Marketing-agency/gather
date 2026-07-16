import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getRoleLabel } from '@/lib/permissions'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({
    authenticated: true,
    adminUserId: session.adminUserId,
    email: session.email,
    role: session.role,
    roleLabel: getRoleLabel(session.role),
    roleLabelAr: getRoleLabel(session.role, 'ar'),
  })
}

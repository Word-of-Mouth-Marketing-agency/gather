import { NextResponse } from 'next/server'
import { getSession } from './auth'

export async function requireAdminApi(): Promise<NextResponse | null> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return null
  } catch {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
  }
}

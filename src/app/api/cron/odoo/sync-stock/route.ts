import { NextResponse } from 'next/server'
import { syncStockFromOdoo } from '@/lib/odoo/stock-sync'
import { timingSafeEqual } from '@/lib/secure-compare'

export async function POST(request: Request) {
  const secret = process.env.ODOO_CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'ODOO_CRON_SECRET is not configured on this server' },
      { status: 503 },
    )
  }

  const auth = request.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ') || !timingSafeEqual(auth.slice(7), secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await syncStockFromOdoo()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

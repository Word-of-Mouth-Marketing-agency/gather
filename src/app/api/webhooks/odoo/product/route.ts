import { NextResponse } from 'next/server'
import { pullSingleProductFromOdoo } from '@/lib/odoo/product-pull'

export async function POST(request: Request) {
  if (process.env.ODOO_WEBHOOK_ENABLED !== 'true') {
    return NextResponse.json({ status: 'disabled', message: 'Webhook processing is disabled' }, { status: 200 })
  }

  const rawSecret = process.env.ODOO_WEBHOOK_SECRET
  if (!rawSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured on this server' }, { status: 503 })
  }

  const header = request.headers.get('x-odoo-webhook-secret')
  if (!header || header !== rawSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const { event, sku, odooProductId } = payload

    if (!event || (!sku && !odooProductId)) {
      return NextResponse.json({ error: 'Invalid payload: event and sku or odooProductId required' }, { status: 400 })
    }

    if (event !== 'product.updated' && event !== 'stock.updated') {
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }

    await pullSingleProductFromOdoo({ sku, odooProductId })

    return NextResponse.json({ status: 'ok', event }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

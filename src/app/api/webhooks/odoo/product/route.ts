import { NextResponse } from 'next/server'
import { pullSingleProductFromOdoo } from '@/lib/odoo/product-pull'
import { isWebhookOnCooldown } from '@/lib/odoo/json-rpc'

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
    const { event, sku, odooProductId, x_nextjs_id, x_slug } = payload

    if (!event || (!sku && !x_nextjs_id && !odooProductId)) {
      return NextResponse.json({ error: 'Invalid payload: event and sku, x_nextjs_id, or odooProductId required' }, { status: 400 })
    }

    if (event !== 'product.created' && event !== 'product.updated' && event !== 'stock.updated') {
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }

    console.info('[Odoo webhook] received product event', { event, sku, odooProductId, x_nextjs_id, x_slug })

    // Cooldown check: if we pushed this change moments ago, skip the pullback
    if (sku && isWebhookOnCooldown(sku)) {
      console.info('[Odoo webhook] skipped product event during cooldown', { event, sku })
      return NextResponse.json({ status: 'cooldown', event, sku }, { status: 200 })
    }

    const result = await pullSingleProductFromOdoo({ event, sku, odooProductId, x_nextjs_id, x_slug })
    console.info('[Odoo webhook] product pull result', result)

    return NextResponse.json({ status: 'ok', event, result }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Odoo webhook] product event failed safely', { error: message })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

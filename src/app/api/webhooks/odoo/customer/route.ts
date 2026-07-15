import { NextResponse } from 'next/server'
import { pullCustomerFromOdoo } from '@/lib/odoo/customer-pull'
import { isWebhookOnCooldown, setWebhookCooldown } from '@/lib/odoo/json-rpc'
import { timingSafeEqual } from '@/lib/secure-compare'

export async function POST(request: Request) {
  if (process.env.ODOO_WEBHOOK_ENABLED !== 'true') {
    return NextResponse.json({ status: 'disabled', message: 'Webhook processing is disabled' }, { status: 200 })
  }

  const rawSecret = process.env.ODOO_WEBHOOK_SECRET
  if (!rawSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured on this server' }, { status: 503 })
  }

  const header = request.headers.get('x-odoo-webhook-secret')
  if (!header || !timingSafeEqual(header, rawSecret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()
    const { event, odooPartnerId, x_nextjs_id, email, phone } = payload

    if (!event) {
      return NextResponse.json({ error: 'Invalid payload: event required' }, { status: 400 })
    }

    if (event !== 'customer.updated') {
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }

    if (!odooPartnerId && !x_nextjs_id && !email && !phone) {
      return NextResponse.json({ error: 'Invalid payload: at least one identifier required' }, { status: 400 })
    }

    // Loop prevention: cooldown on partner identifier
    const cooldownKey = `partner:${odooPartnerId || x_nextjs_id || email}`
    if (isWebhookOnCooldown(cooldownKey)) {
      return NextResponse.json({ status: 'cooldown', event }, { status: 200 })
    }
    setWebhookCooldown(cooldownKey)

    console.info('[Odoo webhook] received customer event', { event, odooPartnerId, x_nextjs_id, email })

    const result = await pullCustomerFromOdoo({ odooPartnerId, x_nextjs_id, email, phone })

    if (result.skipped) {
      console.info('[Odoo webhook] customer pull skipped', { reason: result.reason })
      return NextResponse.json({ status: 'skipped', reason: result.reason }, { status: 200 })
    }

    console.info('[Odoo webhook] customer pull result', { customerId: result.customerId, updatedFields: result.updatedFields })

    return NextResponse.json({
      status: 'ok',
      event,
      customerId: result.customerId,
      updatedFields: result.updatedFields,
    }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Odoo webhook] customer event failed safely', { error: message })
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import { pullSingleProductFromOdoo } from '@/lib/odoo/product-pull'
import { pullCustomerFromOdoo } from '@/lib/odoo/customer-pull'
import type { Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { isWebhookOnCooldown, setWebhookCooldown, logSync } from '@/lib/odoo/json-rpc'
import { timingSafeEqual } from '@/lib/secure-compare'

const CATEGORIES_FILE = 'categories.json'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function disabled() {
  return NextResponse.json({ status: 'disabled', message: 'Webhook processing is disabled' }, { status: 200 })
}

function unconfigured() {
  return NextResponse.json({ error: 'Webhook secret not configured on this server' }, { status: 503 })
}

function badPayload(msg: string) {
  return NextResponse.json({ error: `Invalid payload: ${msg}` }, { status: 400 })
}

function jsonResponse(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status })
}

function verifyAuth(request: Request): boolean {
  const rawSecret = process.env.ODOO_WEBHOOK_SECRET
  if (!rawSecret) return false
  const header = request.headers.get('x-odoo-webhook-secret')
  return !!header && timingSafeEqual(header, rawSecret)
}

async function handleProductEvent(payload: Record<string, unknown>) {
  const { event, sku, odooProductId, x_nextjs_id, x_slug, active } = payload

  if (!event || (!sku && !x_nextjs_id && !odooProductId)) {
    return badPayload('event and sku, x_nextjs_id, or odooProductId required')
  }

  if (event !== 'product.created' && event !== 'product.updated' && event !== 'stock.updated') {
    return badPayload(`unknown event: ${event}`)
  }

  const eventStr = event as string
  const skuStr = sku as string | undefined
  const odooProductIdNum = odooProductId as number | undefined
  const x_nextjs_idStr = x_nextjs_id as string | undefined
  const x_slugStr = x_slug as string | undefined
  const activeBool = active as boolean | undefined

  console.info('[Odoo webhook] received product event', { event: eventStr, sku: skuStr, odooProductId: odooProductIdNum, x_nextjs_id: x_nextjs_idStr, x_slug: x_slugStr, active: activeBool })

  if (skuStr && isWebhookOnCooldown(skuStr)) {
    console.info('[Odoo webhook] skipped product event during cooldown', { event: eventStr, sku: skuStr })
    return jsonResponse({ status: 'cooldown', event: eventStr, sku: skuStr })
  }

  const result = await pullSingleProductFromOdoo({ event: eventStr, sku: skuStr, odooProductId: odooProductIdNum, x_nextjs_id: x_nextjs_idStr, x_slug: x_slugStr, active: activeBool })
  console.info('[Odoo webhook] product pull result', result)

  return jsonResponse({ status: 'ok', event: eventStr, result })
}

async function handleCategoryEvent(payload: Record<string, unknown>) {
  const { event, odooCategoryId, x_nextjs_id, x_slug, name } = payload

  if (!event || !odooCategoryId) {
    return badPayload('event and odooCategoryId required')
  }

  if (event !== 'category.updated') {
    return badPayload(`unknown event: ${event}`)
  }

  const eventStr = event as string
  const odooCategoryIdNum = odooCategoryId as number
  const x_nextjs_idStr = x_nextjs_id as string | undefined
  const x_slugStr = x_slug as string | undefined
  const nameStr = name as string | undefined

  const startMs = Date.now()

  const allCategories = readJson<Category[]>(CATEGORIES_FILE)

  const match = allCategories.find(
    (c) =>
      (x_nextjs_idStr && c.id === x_nextjs_idStr) ||
      c.odooCategoryId === odooCategoryIdNum ||
      (x_slugStr && c.slug === x_slugStr),
  )

  if (!match) {
    logSync({
      direction: 'pull',
      entity: 'category',
      localId: x_nextjs_idStr || 'unknown',
      odooId: odooCategoryIdNum,
      operation: 'webhook',
      durationMs: Date.now() - startMs,
      result: 'skipped',
      error: `Category not found locally (odooId=${odooCategoryIdNum} nextjsId=${x_nextjs_idStr} slug=${x_slugStr})`,
    })
    return jsonResponse({ status: 'skipped', reason: 'Category not found locally' })
  }

  if (match.id && isWebhookOnCooldown(`cat:${match.id}`)) {
    return jsonResponse({ status: 'cooldown', event: eventStr, odooCategoryId: odooCategoryIdNum })
  }

  if (match.id) setWebhookCooldown(`cat:${match.id}`)

  const idx = allCategories.findIndex((c) => c.id === match.id)
  if (idx >= 0) {
    const updated: Category = {
      ...allCategories[idx],
      name: nameStr || allCategories[idx].name,
      odooCategoryId: odooCategoryIdNum,
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: new Date().toISOString(),
    }
    allCategories[idx] = updated
    await writeJson(CATEGORIES_FILE, allCategories)
  }

  logSync({
    direction: 'pull',
    entity: 'category',
    localId: match.id,
    odooId: odooCategoryIdNum,
    operation: 'webhook',
    durationMs: Date.now() - startMs,
    result: 'success',
  })

  return jsonResponse({ status: 'ok', event: eventStr })
}

async function handleCustomerEvent(payload: Record<string, unknown>) {
  const { event, odooPartnerId, x_nextjs_id, email, phone } = payload

  if (!event) {
    return badPayload('event required')
  }

  if (event !== 'customer.updated') {
    return badPayload(`unknown event: ${event}`)
  }

  const odooPartnerIdNum = odooPartnerId as number | undefined
  const x_nextjs_idStr = x_nextjs_id as string | undefined
  const emailStr = email as string | undefined
  const phoneStr = phone as string | undefined

  if (!odooPartnerIdNum && !x_nextjs_idStr && !emailStr && !phoneStr) {
    return badPayload('at least one identifier required')
  }

  const cooldownKey = `partner:${odooPartnerIdNum || x_nextjs_idStr || emailStr}`
  if (isWebhookOnCooldown(cooldownKey)) {
    return jsonResponse({ status: 'cooldown', event })
  }
  setWebhookCooldown(cooldownKey)

  console.info('[Odoo webhook] received customer event', { event, odooPartnerId: odooPartnerIdNum, x_nextjs_id: x_nextjs_idStr, email: emailStr })

  const result = await pullCustomerFromOdoo({ odooPartnerId: odooPartnerIdNum, x_nextjs_id: x_nextjs_idStr, email: emailStr, phone: phoneStr })

  if (result.skipped) {
    console.info('[Odoo webhook] customer pull skipped', { reason: result.reason })
    return jsonResponse({ status: 'skipped', reason: result.reason })
  }

  console.info('[Odoo webhook] customer pull result', { customerId: result.customerId, updatedFields: result.updatedFields })

  return jsonResponse({
    status: 'ok',
    event,
    customerId: result.customerId,
    updatedFields: result.updatedFields,
  })
}

export async function POST(request: Request) {
  if (process.env.ODOO_WEBHOOK_ENABLED !== 'true') return disabled()

  const rawSecret = process.env.ODOO_WEBHOOK_SECRET
  if (!rawSecret) return unconfigured()

  if (!verifyAuth(request)) return unauthorized()

  try {
    const payload = await request.json()
    const event = (payload.event || '') as string

    if (!event) return badPayload('event field required')

    if (event === 'product.created' || event === 'product.updated' || event === 'stock.updated') {
      return handleProductEvent(payload)
    }

    if (event === 'category.updated') {
      return handleCategoryEvent(payload)
    }

    if (event === 'customer.updated') {
      return handleCustomerEvent(payload)
    }

    return badPayload(`unknown event type: ${event}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[Odoo webhook] event dispatch failed', { error: message })
    return badPayload('could not parse request body')
  }
}

import { NextResponse } from 'next/server'
import type { Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { isWebhookOnCooldown, setWebhookCooldown, logSync } from '@/lib/odoo/json-rpc'

const CATEGORIES_FILE = 'categories.json'

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
    const { event, odooCategoryId, x_nextjs_id, x_slug, name } = payload

    if (!event || !odooCategoryId) {
      return NextResponse.json({ error: 'Invalid payload: event and odooCategoryId required' }, { status: 400 })
    }

    if (event !== 'category.updated') {
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 400 })
    }

    const startMs = Date.now()

    const allCategories = readJson<Category[]>(CATEGORIES_FILE)

    const match = allCategories.find(
      (c) =>
        (x_nextjs_id && c.id === x_nextjs_id) ||
        c.odooCategoryId === odooCategoryId ||
        (x_slug && c.slug === x_slug),
    )

    if (!match) {
      logSync({
        direction: 'pull',
        entity: 'category',
        localId: x_nextjs_id || 'unknown',
        odooId: odooCategoryId,
        operation: 'webhook',
        durationMs: Date.now() - startMs,
        result: 'skipped',
        error: `Category not found locally (odooId=${odooCategoryId} nextjsId=${x_nextjs_id} slug=${x_slug})`,
      })
      return NextResponse.json({ status: 'skipped', reason: 'Category not found locally' }, { status: 200 })
    }

    if (match.id && isWebhookOnCooldown(`cat:${match.id}`)) {
      return NextResponse.json({ status: 'cooldown', event, odooCategoryId }, { status: 200 })
    }

    if (match.id) setWebhookCooldown(`cat:${match.id}`)

    const idx = allCategories.findIndex((c) => c.id === match.id)
    if (idx >= 0) {
      const updated: Category = {
        ...allCategories[idx],
        name: name || allCategories[idx].name,
        odooCategoryId,
        syncStatus: 'synced',
        syncError: undefined,
        lastSyncedAt: new Date().toISOString(),
      }
      allCategories[idx] = updated
      writeJson(CATEGORIES_FILE, allCategories)
    }

    logSync({
      direction: 'pull',
      entity: 'category',
      localId: match.id,
      odooId: odooCategoryId,
      operation: 'webhook',
      durationMs: Date.now() - startMs,
      result: 'success',
    })

    return NextResponse.json({ status: 'ok', event }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

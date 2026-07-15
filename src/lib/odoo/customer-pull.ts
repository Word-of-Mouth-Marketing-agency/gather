import type { Customer } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { odooSearchRead } from './json-rpc'
import { logSync } from './json-rpc'

const CUSTOMERS_FILE = 'customers.json'

function loadCustomers(): Customer[] {
  return readJson<Customer[]>(CUSTOMERS_FILE)
}

async function saveCustomers(items: Customer[]): Promise<void> {
  await writeJson(CUSTOMERS_FILE, items)
}

function normalizePhone(phone?: string): string {
  if (!phone) return ''
  return phone.replace(/[\s\-()+]/g, '')
}

export interface CustomerPullResult {
  matched: boolean
  customerId?: string
  updatedFields: string[]
  skipped: boolean
  reason?: string
}

/**
 * Match a local customer from Odoo partner data using the 4-step chain:
 * 1. odooPartnerId
 * 2. x_nextjs_id
 * 3. email (case-insensitive)
 * 4. normalized phone
 */
function matchLocalCustomer(partner: {
  odooPartnerId?: number
  x_nextjs_id?: string
  email?: string
  phone?: string
}): Customer | null {
  const all = loadCustomers()

  // Step 1: odooPartnerId
  if (partner.odooPartnerId) {
    const match = all.find((c) => c.odooPartnerId === partner.odooPartnerId)
    if (match) return match
  }

  // Step 2: x_nextjs_id
  if (partner.x_nextjs_id) {
    const match = all.find((c) => c.id === partner.x_nextjs_id)
    if (match) return match
  }

  // Step 3: email (case-insensitive)
  if (partner.email) {
    const match = all.find((c) => c.email.toLowerCase() === partner.email!.toLowerCase())
    if (match) return match
  }

  // Step 4: normalized phone
  const phone = normalizePhone(partner.phone)
  if (phone) {
    const match = all.find((c) => normalizePhone(c.phone) === phone)
    if (match) return match
  }

  return null
}

/**
 * Pull a customer update from Odoo.
 * Updates only profile fields (name, email, phone, addresses).
 * Never touches password, auth tokens, sessions, cookies, or any auth-related fields.
 */
export async function pullCustomerFromOdoo(payload: {
  odooPartnerId?: number
  x_nextjs_id?: string
  email?: string
  phone?: string
}): Promise<CustomerPullResult> {
  const startMs = Date.now()

  const matched = matchLocalCustomer(payload)
  if (!matched) {
    logSync({
      direction: 'pull',
      entity: 'customer',
      localId: payload.x_nextjs_id || payload.email || 'unknown',
      odooId: payload.odooPartnerId,
      operation: 'webhook',
      durationMs: Date.now() - startMs,
      result: 'skipped',
      error: `No local customer matched (partnerId=${payload.odooPartnerId} nextjsId=${payload.x_nextjs_id} email=${payload.email})`,
    })
    return { matched: false, updatedFields: [], skipped: true, reason: 'No local customer matched' }
  }

  // Fetch full partner data from Odoo
  if (!payload.odooPartnerId) {
    return { matched: false, customerId: matched.id, updatedFields: [], skipped: true, reason: 'No odooPartnerId provided for fetch' }
  }

  const partnerData = await odooSearchRead<{
    id: number
    name: string
    email: string
    phone: string
    mobile: string
    street: string
    street2: string
    city: string
    zip: string
    comment: string
    x_nextjs_id: string
  }>(
    'res.partner',
    [['id', '=', payload.odooPartnerId]],
    ['id', 'name', 'email', 'phone', 'mobile', 'street', 'street2', 'city', 'zip', 'comment', 'x_nextjs_id'],
    1,
  )

  if (partnerData.length === 0) {
    logSync({
      direction: 'pull',
      entity: 'customer',
      localId: matched.id,
      odooId: payload.odooPartnerId,
      operation: 'webhook',
      durationMs: Date.now() - startMs,
      result: 'skipped',
      error: `Partner ${payload.odooPartnerId} not found in Odoo`,
    })
    return { matched: false, customerId: matched.id, updatedFields: [], skipped: true, reason: 'Partner not found in Odoo' }
  }

  const partner = partnerData[0]
  const updatedFields: string[] = []
  const all = loadCustomers()
  const idx = all.findIndex((c) => c.id === matched.id)
  if (idx < 0) {
    return { matched: false, updatedFields: [], skipped: true, reason: 'Customer disappeared during pull' }
  }

  const current = all[idx]

  // Update name
  if (partner.name && partner.name !== current.name) {
    all[idx].name = partner.name
    updatedFields.push('name')
  }

  // Update email (conservative — only if different and non-empty)
  if (partner.email && partner.email.toLowerCase() !== current.email.toLowerCase()) {
    all[idx].email = partner.email.toLowerCase()
    updatedFields.push('email')
  }

  // Update phone
  const odooPhone = partner.phone || partner.mobile || ''
  if (odooPhone && normalizePhone(odooPhone) !== normalizePhone(current.phone)) {
    all[idx].phone = normalizePhone(odooPhone)
    updatedFields.push('phone')
  }

  // Update sync metadata
  all[idx].odooPartnerId = partner.id
  all[idx].syncStatus = 'synced'
  all[idx].syncError = undefined
  all[idx].lastSyncedAt = new Date().toISOString()

  if (updatedFields.length > 0) {
    await saveCustomers(all)
  }

  logSync({
    direction: 'pull',
    entity: 'customer',
    localId: matched.id,
    odooId: partner.id,
    operation: 'webhook',
    durationMs: Date.now() - startMs,
    result: 'success',
  })

  return { matched: true, customerId: matched.id, updatedFields, skipped: false }
}

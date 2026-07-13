import { readJson, writeJson } from '@/lib/db'
import type { Customer } from '@/types'
import { getOdooConfig, odooSearchRead, odooCreate, odooWrite, logSync } from './json-rpc'

const CUSTOMERS_FILE = 'customers.json'

function loadCustomers(): Customer[] {
  return readJson<Customer[]>(CUSTOMERS_FILE)
}

function saveCustomers(items: Customer[]): void {
  writeJson(CUSTOMERS_FILE, items)
}

function normalizePhone(phone?: string): string {
  if (!phone) return ''
  return phone.replace(/[\s\-()+]/g, '')
}

/**
 * Resolve the default address from a customer's address list.
 * Returns the first address marked isDefault, or the first one, or null.
 */
function resolveDefaultAddress(addresses: Customer['addresses']): Customer['addresses'][number] | null {
  if (!addresses || addresses.length === 0) return null
  return addresses.find((a) => a.isDefault) ?? addresses[0]
}

/**
 * Match an existing Odoo partner via the 5-step chain:
 * 1. valid odooPartnerId
 * 2. x_nextjs_id on partner
 * 3. case-insensitive email
 * 4. normalized phone/mobile
 * Returns the partner ID or null.
 */
async function matchOdooPartner(customer: Customer): Promise<number | null> {
  // Step 1: cached odooPartnerId
  if (customer.odooPartnerId) {
    const existing = await odooSearchRead(
      'res.partner',
      [['id', '=', customer.odooPartnerId]],
      ['id'],
      1,
    )
    if (existing.length > 0) return customer.odooPartnerId
  }

  // Step 2: x_nextjs_id
  const byNextjsId = await odooSearchRead(
    'res.partner',
    [['x_nextjs_id', '=', customer.id]],
    ['id'],
    1,
  )
  if (byNextjsId.length > 0) return byNextjsId[0].id as number

  // Step 3: case-insensitive email
  if (customer.email) {
    const byEmail = await odooSearchRead(
      'res.partner',
      [['email', '=ilike', customer.email.trim()]],
      ['id'],
      1,
    )
    if (byEmail.length > 0) return byEmail[0].id as number
  }

  // Step 4: normalized phone/mobile
  const phone = normalizePhone(customer.phone)
  if (phone) {
    const byPhone = await odooSearchRead(
      'res.partner',
      ['|', ['phone', '=', phone], ['mobile', '=', phone]],
      ['id'],
      1,
    )
    if (byPhone.length > 0) return byPhone[0].id as number
  }

  return null
}

/**
 * Build the field values to push to Odoo res.partner.
 * Never includes passwords, hashes, tokens, sessions, or auth data.
 */
function buildPartnerFields(customer: Customer): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    x_nextjs_id: customer.id,
    name: customer.name || customer.email.split('@')[0],
    email: customer.email.trim(),
  }

  if (customer.phone) fields.phone = normalizePhone(customer.phone) || false

  const addr = resolveDefaultAddress(customer.addresses)
  if (addr) {
    if (addr.street) fields.street = addr.street
    if (addr.city) fields.city = addr.city
  }

  return fields
}

/**
 * Main sync function: sync a website customer to Odoo res.partner.
 * - Matches via 5-step chain or creates new partner
 * - Updates matching partner fields
 * - Persists odooPartnerId, syncStatus, syncError, lastSyncedAt locally
 * - Never blocks the calling flow on failure
 * - Never sends passwords/auth data
 */
export async function syncPartnerFromCustomer(customerId: string): Promise<void> {
  const startMs = Date.now()
  const config = getOdooConfig()
  if (!config) return

  try {
    const all = loadCustomers()
    const customer = all.find((c) => c.id === customerId)
    if (!customer) return

    const partnerId = await matchOdooPartner(customer)

    if (partnerId) {
      // Update existing partner
      const partnerFields = buildPartnerFields(customer)
      await odooWrite('res.partner', partnerId, partnerFields)

      // Persist locally
      const idx = all.findIndex((c) => c.id === customerId)
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          odooPartnerId: partnerId,
          syncStatus: 'synced',
          syncError: undefined,
          lastSyncedAt: new Date().toISOString(),
        }
        saveCustomers(all)
      }

      logSync({
        direction: 'push',
        entity: 'customer',
        localId: customerId,
        odooId: partnerId,
        operation: 'sync_partner_update',
        durationMs: Date.now() - startMs,
        result: 'success',
      })
    } else {
      // Step 5: create new partner
      const partnerFields = buildPartnerFields(customer)
      const newPartnerId = await odooCreate('res.partner', partnerFields)

      // Persist locally
      const idx = all.findIndex((c) => c.id === customerId)
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          odooPartnerId: newPartnerId,
          syncStatus: 'synced',
          syncError: undefined,
          lastSyncedAt: new Date().toISOString(),
        }
        saveCustomers(all)
      }

      logSync({
        direction: 'push',
        entity: 'customer',
        localId: customerId,
        odooId: newPartnerId,
        operation: 'sync_partner_create',
        durationMs: Date.now() - startMs,
        result: 'success',
      })
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    // Record failure locally but never block the calling flow
    try {
      const all = loadCustomers()
      const idx = all.findIndex((c) => c.id === customerId)
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          syncStatus: 'sync_failed',
          syncError: errorMsg.slice(0, 300),
        }
        saveCustomers(all)
      }
    } catch { /* secondary failure — silent */ }

    logSync({
      direction: 'push',
      entity: 'customer',
      localId: customerId,
      operation: 'sync_partner',
      durationMs: Date.now() - startMs,
      result: 'failed',
      error: errorMsg.slice(0, 200),
    })
  }
}

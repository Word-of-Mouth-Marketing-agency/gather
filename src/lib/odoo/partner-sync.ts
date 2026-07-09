import { readJson, writeJson } from '@/lib/db'
import type { Customer } from '@/types'
import { getOdooConfig, odooSearchRead, odooCreate } from './json-rpc'

const CUSTOMERS_FILE = 'customers.json'

function loadCustomers(): Customer[] {
  return readJson<Customer[]>(CUSTOMERS_FILE)
}

function saveCustomers(items: Customer[]): void {
  writeJson(CUSTOMERS_FILE, items)
}

export async function syncPartnerFromCustomer(customerId: string): Promise<void> {
  const config = getOdooConfig()
  if (!config) return

  try {
    const all = loadCustomers()
    const customer = all.find((c) => c.id === customerId)
    if (!customer) return

    let partnerId: number | undefined

    if (customer.odooPartnerId) {
      const existing = await odooSearchRead('res.partner', [['id', '=', customer.odooPartnerId]], ['id'], 1)
      if (existing.length > 0) {
        partnerId = customer.odooPartnerId
      }
    }

    if (!partnerId) {
      const byEmail = await odooSearchRead('res.partner', [['email', '=ilike', customer.email.trim()]], ['id'], 1)
      if (byEmail.length > 0) {
        partnerId = byEmail[0].id as number
      }
    }

    if (!partnerId) {
      const phone = customer.phone?.replace(/[\s-]/g, '')
      if (phone) {
        const byPhone = await odooSearchRead(
          'res.partner',
          ['|', ['phone', '=', phone], ['mobile', '=', phone]],
          ['id'], 1,
        )
        if (byPhone.length > 0) {
          partnerId = byPhone[0].id as number
        }
      }
    }

    if (!partnerId) {
      partnerId = await odooCreate('res.partner', {
        name: customer.name || customer.email.split('@')[0],
        email: customer.email.trim(),
        phone: customer.phone?.replace(/[\s-]/g, '') || false,
      })
    }

    const updated = loadCustomers()
    const idx = updated.findIndex((c) => c.id === customerId)
    if (idx >= 0) {
      updated[idx] = { ...updated[idx], odooPartnerId: partnerId }
      saveCustomers(updated)
    }
  } catch {
    // Partner sync failure never blocks the calling flow
  }
}

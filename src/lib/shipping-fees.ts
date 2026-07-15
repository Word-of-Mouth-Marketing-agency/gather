import type { ShippingFee } from '@/types'
import { readJson, writeJson, generateId } from './db'

const SHIPPING_FEES_FILE = 'shipping-fees.json'
export const DEFAULT_SHIPPING_FEE = 50

function sortFees(items: ShippingFee[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export function getAllShippingFees(): ShippingFee[] {
  try {
    return sortFees(readJson<ShippingFee[]>(SHIPPING_FEES_FILE))
  } catch {
    return []
  }
}

export function getActiveShippingFees(): ShippingFee[] {
  return getAllShippingFees().filter((item) => item.isActive !== false)
}

export function getShippingFeeById(id: string): ShippingFee | undefined {
  return getAllShippingFees().find((item) => item.id === id)
}

export function getShippingFeeForCity(city: string): number {
  const normalized = city.trim().toLowerCase()
  const activeFees = getActiveShippingFees()
  const match = activeFees.find((item) => item.city.trim().toLowerCase() === normalized)
  const fallback = activeFees.find((item) => item.city.trim().toLowerCase() === 'other')
  return match?.fee ?? fallback?.fee ?? DEFAULT_SHIPPING_FEE
}

export async function createShippingFee(data: Omit<ShippingFee, 'id'>): Promise<ShippingFee> {
  const items = getAllShippingFees()
  const item: ShippingFee = {
    ...data,
    id: generateId('ship'),
    fee: Number(data.fee) || DEFAULT_SHIPPING_FEE,
    isActive: data.isActive ?? true,
    sortOrder: data.sortOrder ?? items.length + 1,
  }
  items.push(item)
  await writeJson(SHIPPING_FEES_FILE, sortFees(items))
  return item
}

export async function updateShippingFee(id: string, data: Partial<ShippingFee>): Promise<ShippingFee | undefined> {
  const items = getAllShippingFees()
  const idx = items.findIndex((item) => item.id === id)
  if (idx < 0) return undefined
  items[idx] = {
    ...items[idx],
    ...data,
    fee: data.fee === undefined ? items[idx].fee : Number(data.fee),
  }
  await writeJson(SHIPPING_FEES_FILE, sortFees(items))
  return items[idx]
}

export async function deleteShippingFee(id: string): Promise<boolean> {
  const items = getAllShippingFees()
  const idx = items.findIndex((item) => item.id === id)
  if (idx < 0) return false
  items.splice(idx, 1)
  await writeJson(SHIPPING_FEES_FILE, sortFees(items))
  return true
}

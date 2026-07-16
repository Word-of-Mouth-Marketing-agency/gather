import { NextResponse } from 'next/server'
import { getSession } from './auth'
import { hasAnyPermission } from './permissions'
import type { AdminSession } from './auth'
import { getProductRepository } from './repositories'

export type { AdminSession }

export {
  CONTENT_FIELDS,
  PRICING_FIELDS,
  STOCK_FIELDS,
  ALL_FIELDS,
  filterContentFields,
  filterPricingFields,
  filterStockFields,
} from './product-fields'

export function normalizeSku(sku: unknown): string {
  return String(sku ?? '').trim().toUpperCase()
}

export function validateSku(sku: string, excludeId?: string): string | null {
  if (!sku) return 'SKU is required for Odoo sync.'
  const repo = getProductRepository()
  const all = repo.getAll(true)
  const dup = all.find((p) => p.sku?.trim().toUpperCase() === sku && p.id !== excludeId)
  if (dup) return `SKU "${sku}" is already used by product "${dup.name}".`
  return null
}

export function normalizeStock(stock: unknown): number | undefined {
  if (stock === undefined || stock === null || stock === '') return undefined
  const value = Number(stock)
  if (!Number.isFinite(value)) return undefined
  return Math.max(0, Math.floor(value))
}

export function logOp(op: string, id: string, sku?: string, extra?: string) {
  const ts = new Date().toISOString()
  console.log(`[PRODUCT_${op}] id=${id}${sku ? ` sku=${sku}` : ''}${extra ? ` ${extra}` : ''} ts=${ts}`)
}

export async function requireAdminOrResponse(
  permissions: Parameters<typeof hasAnyPermission>[1],
): Promise<{ session: AdminSession } | NextResponse> {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }
    if (!hasAnyPermission(session.role, permissions)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return { session }
  } catch {
    return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
  }
}

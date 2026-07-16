import type { Coupon, CouponDiscountType, CouponValidationResult, CouponValidationRequest } from '@/types'
import { readJson, writeJson, generateId } from './db'

const COUPONS_FILE = 'coupons.json'

function normalizeCode(code: string): string {
  return code.trim().toUpperCase()
}

function now(): string {
  return new Date().toISOString()
}

export function getAllCoupons(): Coupon[] {
  try {
    return readJson<Coupon[]>(COUPONS_FILE)
  } catch {
    return []
  }
}

export function getCouponById(id: string): Coupon | undefined {
  return getAllCoupons().find((c) => c.id === id)
}

export function getCouponByCode(code: string): Coupon | undefined {
  const normal = normalizeCode(code)
  return getAllCoupons().find((c) => normalizeCode(c.code) === normal)
}

export function isCodeTaken(code: string, excludeId?: string): boolean {
  const normal = normalizeCode(code)
  return getAllCoupons().some((c) => c.id !== excludeId && normalizeCode(c.code) === normal)
}

export async function createCoupon(data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt'>): Promise<Coupon> {
  const code = normalizeCode(data.code)
  const coupon: Coupon = {
    ...data,
    code,
    id: generateId('cpn'),
    usageCount: 0,
    createdAt: now(),
  }
  const items = getAllCoupons()
  items.push(coupon)
  await writeJson(COUPONS_FILE, items)
  return coupon
}

export async function updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon | undefined> {
  const items = getAllCoupons()
  const idx = items.findIndex((c) => c.id === id)
  if (idx < 0) return undefined
  if (data.code) data.code = normalizeCode(data.code)
  items[idx] = { ...items[idx], ...data, updatedAt: now() }
  await writeJson(COUPONS_FILE, items)
  return items[idx]
}

export async function deleteCoupon(id: string): Promise<boolean> {
  const items = getAllCoupons()
  const idx = items.findIndex((c) => c.id === id)
  if (idx < 0) return false
  items.splice(idx, 1)
  await writeJson(COUPONS_FILE, items)
  return true
}

export async function incrementUsage(id: string): Promise<boolean> {
  const items = getAllCoupons()
  const idx = items.findIndex((c) => c.id === id)
  if (idx < 0) return false
  items[idx].usageCount = (items[idx].usageCount || 0) + 1
  await writeJson(COUPONS_FILE, items)
  return true
}

export async function validateCoupon(req: CouponValidationRequest, allProducts: { id: string; price: number; salePrice: number | null; categoryIds: string[] }[]): Promise<CouponValidationResult> {
  const coupon = getCouponByCode(req.code)
  if (!coupon) return { valid: false, reason: 'Invalid coupon code' }
  if (!coupon.isActive) return { valid: false, reason: 'This coupon is no longer active' }

  const nowMs = Date.now()
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > nowMs) {
    return { valid: false, reason: 'This coupon is not yet active' }
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < nowMs) {
    return { valid: false, reason: 'This coupon has expired' }
  }

  if (coupon.usageLimit && (coupon.usageCount || 0) >= coupon.usageLimit) {
    return { valid: false, reason: 'This coupon has reached its usage limit' }
  }

  let eligibleSubtotal = 0
  const eligibleItems: { productId: string; quantity: number }[] = []

  for (const item of req.items) {
    const product = allProducts.find((p) => p.id === item.productId)
    if (!product) continue

    if (coupon.excludedProductIds?.includes(item.productId)) continue

    if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      if (!coupon.applicableProductIds.includes(item.productId)) continue
    }
    if (coupon.applicableCategoryIds && coupon.applicableCategoryIds.length > 0) {
      const hasCategory = product.categoryIds.some((cid) => coupon.applicableCategoryIds!.includes(cid))
      if (!hasCategory) continue
    }

    const unitPrice = (product.salePrice && product.salePrice > 0) ? product.salePrice : product.price
    eligibleSubtotal += unitPrice * item.quantity
    eligibleItems.push(item)
  }

  if (eligibleItems.length === 0) {
    return { valid: false, reason: 'No items in your cart are eligible for this coupon' }
  }

  if (coupon.minimumOrderAmount && eligibleSubtotal < coupon.minimumOrderAmount) {
    return { valid: false, reason: `Minimum order amount of ${coupon.minimumOrderAmount} EGP not met` }
  }

  let discount = 0
  if (coupon.discountType === 'percentage') {
    discount = eligibleSubtotal * (coupon.discountValue / 100)
    if (coupon.maximumDiscountAmount && discount > coupon.maximumDiscountAmount) {
      discount = coupon.maximumDiscountAmount
    }
  } else {
    discount = coupon.discountValue
  }

  if (discount > eligibleSubtotal) discount = eligibleSubtotal
  if (discount < 0) discount = 0

  return {
    valid: true,
    coupon,
    discount: Math.round(discount * 100) / 100,
    eligibleSubtotal,
  }
}

export function getCouponStats(): { total: number; active: number; scheduled: number; expired: number } {
  const all = getAllCoupons()
  const nowMs = Date.now()
  return {
    total: all.length,
    active: all.filter((c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt).getTime() > nowMs) && (!c.startsAt || new Date(c.startsAt).getTime() <= nowMs)).length,
    scheduled: all.filter((c) => c.startsAt && new Date(c.startsAt).getTime() > nowMs).length,
    expired: all.filter((c) => c.expiresAt && new Date(c.expiresAt).getTime() < nowMs).length,
  }
}

import type { Bundle, Product } from '@/types'

export type BundleScheduleStatus = 'Disabled' | 'Scheduled' | 'Active' | 'Expired'

function dateOnly(value: string) {
  return value.slice(0, 10)
}

export function todayString(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function isWithinDateRange(startsAt?: string, endsAt?: string, now = new Date()) {
  const today = todayString(now)
  const starts = startsAt ? dateOnly(startsAt) : ''
  const ends = endsAt ? dateOnly(endsAt) : ''
  if (starts && today < starts) return false
  if (ends && today > ends) return false
  return true
}

export function getBundleStatus(bundle: Bundle, now = new Date()): BundleScheduleStatus {
  if (bundle.isActive === false) return 'Disabled'
  const today = todayString(now)
  const starts = bundle.startsAt ? dateOnly(bundle.startsAt) : ''
  const ends = bundle.endsAt ? dateOnly(bundle.endsAt) : ''
  if (starts && today < starts) return 'Scheduled'
  if (ends && today > ends) return 'Expired'
  return 'Active'
}

export function isBundlePurchasable(bundle: Bundle, now = new Date()) {
  return getBundleStatus(bundle, now) === 'Active'
}

export function isProductDiscountActive(product: Product, now = new Date()) {
  if (product.salePrice === null || product.salePrice === undefined) return false
  return isWithinDateRange(product.discountStartsAt, product.discountEndsAt, now)
}

export function getActiveProductPrice(product: Product, now = new Date()) {
  return isProductDiscountActive(product, now) ? product.salePrice! : product.price
}

export function getProductCompareAtPrice(product: Product, now = new Date()) {
  return isProductDiscountActive(product, now) ? product.price : undefined
}

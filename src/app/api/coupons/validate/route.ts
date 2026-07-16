import { NextResponse } from 'next/server'
import { validateCoupon } from '@/lib/coupons'
import { rateLimit } from '@/lib/rate-limit'
import { readJson } from '@/lib/db'
import type { Product, CouponValidationRequest } from '@/types'

export async function POST(request: Request) {
  const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 30 })
  if (!rl.ok) return rl.response

  try {
    const body = await request.json() as CouponValidationRequest
    if (!body.code || typeof body.code !== 'string' || !body.code.trim()) {
      return NextResponse.json({ valid: false, reason: 'Please enter a coupon code' })
    }

    const products = readJson<Product[]>('products.json')
    const result = await validateCoupon(body, products)

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        couponCode: result.coupon!.code,
        discount: result.discount,
        eligibleSubtotal: result.eligibleSubtotal,
        discountType: result.coupon!.discountType,
      })
    }

    return NextResponse.json({ valid: false, reason: result.reason })
  } catch {
    return NextResponse.json({ valid: false, reason: 'Invalid request' })
  }
}

import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { getAllCoupons, createCoupon, isCodeTaken } from '@/lib/coupons'
import { recordAuditEvent } from '@/lib/audit-log'

export async function GET() {
  const auth = await requireAnyAdminPermission(['coupons.read'])
  if (auth instanceof NextResponse) return auth
  return NextResponse.json(getAllCoupons())
}

export async function POST(request: Request) {
  const auth = await requireAnyAdminPermission(['coupons.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const data = await request.json()

    if (!data.code || typeof data.code !== 'string' || !data.code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required', field: 'code' }, { status: 400 })
    }

    if (isCodeTaken(data.code)) {
      return NextResponse.json({ error: 'A coupon with this code already exists', field: 'code' }, { status: 409 })
    }

    if (data.discountType === 'percentage') {
      const val = Number(data.discountValue)
      if (!val || val <= 0 || val > 100) {
        return NextResponse.json({ error: 'Percentage discount must be between 1 and 100', field: 'discountValue' }, { status: 400 })
      }
    } else if (data.discountType === 'fixed_amount') {
      const val = Number(data.discountValue)
      if (!val || val <= 0) {
        return NextResponse.json({ error: 'Fixed discount must be greater than 0', field: 'discountValue' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Discount type must be percentage or fixed_amount', field: 'discountType' }, { status: 400 })
    }

    if (data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== null && Number(data.minimumOrderAmount) < 0) {
      return NextResponse.json({ error: 'Minimum order amount cannot be negative', field: 'minimumOrderAmount' }, { status: 400 })
    }

    if (data.maximumDiscountAmount !== undefined && data.maximumDiscountAmount !== null && Number(data.maximumDiscountAmount) < 0) {
      return NextResponse.json({ error: 'Maximum discount amount cannot be negative', field: 'maximumDiscountAmount' }, { status: 400 })
    }

    if (data.usageLimit !== undefined && data.usageLimit !== null && Number(data.usageLimit) < 0) {
      return NextResponse.json({ error: 'Usage limit cannot be negative', field: 'usageLimit' }, { status: 400 })
    }

    if (data.startsAt && data.expiresAt && new Date(data.expiresAt) <= new Date(data.startsAt)) {
      return NextResponse.json({ error: 'Expiry date must be after start date', field: 'expiresAt' }, { status: 400 })
    }

    const coupon = await createCoupon({
      code: data.code.trim().toUpperCase(),
      description: data.description || '',
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minimumOrderAmount: data.minimumOrderAmount !== undefined && data.minimumOrderAmount !== null ? Number(data.minimumOrderAmount) : undefined,
      maximumDiscountAmount: data.maximumDiscountAmount !== undefined && data.maximumDiscountAmount !== null ? Number(data.maximumDiscountAmount) : undefined,
      usageLimit: data.usageLimit !== undefined && data.usageLimit !== null ? Number(data.usageLimit) : undefined,
      perCustomerLimit: data.perCustomerLimit !== undefined && data.perCustomerLimit !== null ? Number(data.perCustomerLimit) : undefined,
      startsAt: data.startsAt || undefined,
      expiresAt: data.expiresAt || undefined,
      applicableProductIds: data.applicableProductIds || undefined,
      applicableCategoryIds: data.applicableCategoryIds || undefined,
      excludedProductIds: data.excludedProductIds || undefined,
      isActive: data.isActive !== false,
    })

    await recordAuditEvent({
      adminUserId: auth.session.adminUserId,
      adminEmail: auth.session.email,
      adminRole: auth.session.role,
      action: 'coupon.created',
      targetType: 'coupon',
      targetId: coupon.id,
      metadata: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

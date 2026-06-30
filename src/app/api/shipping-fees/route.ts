import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { createShippingFee, getAllShippingFees, getActiveShippingFees } from '@/lib/shipping-fees'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'
  return NextResponse.json(activeOnly ? getActiveShippingFees() : getAllShippingFees())
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const data = await request.json()
    const item = createShippingFee(data)
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

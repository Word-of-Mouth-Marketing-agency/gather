import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getBundleRepository } from '@/lib/repositories'

export async function GET() {
  const repo = getBundleRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const data = await request.json()
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      return NextResponse.json({ error: 'Offer end date cannot be before start date' }, { status: 400 })
    }
    if (Array.isArray(data.productIds)) {
      data.productIds = [...new Set(data.productIds)]
    }
    const repo = getBundleRepository()
    const item = repo.create(data)
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

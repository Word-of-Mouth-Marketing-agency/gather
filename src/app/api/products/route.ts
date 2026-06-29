import { NextResponse } from 'next/server'
import { getProductRepository } from '@/lib/repositories'

export async function GET() {
  const repo = getProductRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (data.discountStartsAt && data.discountEndsAt && data.discountEndsAt < data.discountStartsAt) {
      return NextResponse.json({ error: 'Discount end date cannot be before start date' }, { status: 400 })
    }
    const repo = getProductRepository()
    const product = repo.create(data)
    return NextResponse.json(product, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

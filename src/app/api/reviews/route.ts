import { NextResponse } from 'next/server'
import { readJson, writeJson, generateId } from '@/lib/db'
import type { Review, ReviewStatus } from '@/types'

const FILE = 'reviews.json'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('productId')
  const status = searchParams.get('status') as ReviewStatus | null
  const isVisible = searchParams.get('isVisible')

  let reviews = readJson<Review[]>(FILE)

  if (productId) {
    reviews = reviews.filter((r) => r.productId === productId)
  }
  if (status) {
    reviews = reviews.filter((r) => r.status === status)
  }
  if (isVisible !== null) {
    reviews = reviews.filter((r) => r.isVisible === (isVisible === 'true'))
  }

  reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json(reviews)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.productId || !body.customerName || !body.customerEmail || !body.comment || !body.rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const reviews = readJson<Review[]>(FILE)
    const now = new Date().toISOString()

    const newReview: Review = {
      id: generateId('review'),
      productId: body.productId,
      customerId: body.customerId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      rating: body.rating,
      title: body.title,
      comment: body.comment,
      status: 'pending',
      isVisible: false,
      createdAt: now,
      updatedAt: now,
    }

    reviews.push(newReview)
    await writeJson(FILE, reviews)

    return NextResponse.json(newReview, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
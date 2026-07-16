import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { Review, ReviewStatus } from '@/types'

const FILE = 'reviews.json'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyAdminPermission(['ratings.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const body = await request.json()

    const reviews = readJson<Review[]>(FILE)
    const index = reviews.findIndex((r) => r.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const review = reviews[index]
    const now = new Date().toISOString()

    if (body.status !== undefined) {
      if (!['pending', 'approved', 'rejected'].includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      review.status = body.status as ReviewStatus
      review.reviewedAt = now
    }

    if (body.isVisible !== undefined) {
      review.isVisible = Boolean(body.isVisible)
    }

    if (body.title !== undefined) {
      review.title = body.title
    }

    if (body.comment !== undefined) {
      review.comment = body.comment
    }

    review.updatedAt = now
    reviews[index] = review

    await writeJson(FILE, reviews)

    return NextResponse.json(review)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAnyAdminPermission(['ratings.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await params
    const reviews = readJson<Review[]>(FILE)
    const index = reviews.findIndex((r) => r.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    reviews.splice(index, 1)
    await writeJson(FILE, reviews)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

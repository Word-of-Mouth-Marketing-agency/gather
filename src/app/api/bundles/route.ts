import { NextResponse } from 'next/server'
import { getBundleRepository } from '@/lib/repositories'

export async function GET() {
  const repo = getBundleRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) {
      return NextResponse.json({ error: 'Offer end date cannot be before start date' }, { status: 400 })
    }
    const repo = getBundleRepository()
    const item = repo.create(data)
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

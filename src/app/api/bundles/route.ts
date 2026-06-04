import { NextResponse } from 'next/server'
import { getBundleRepository } from '@/lib/repositories'

export async function GET() {
  const repo = getBundleRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const repo = getBundleRepository()
    const item = repo.create(data)
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { HomepageContent } from '@/types'

const FILE = 'homepage.json'

export async function GET() {
  const data = readJson<HomepageContent>(FILE)
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const current = readJson<HomepageContent>(FILE)

    const updated: HomepageContent = {
      heroSlides: Array.isArray(body.heroSlides) ? body.heroSlides : current.heroSlides,
      heroText: body.heroText ?? current.heroText,
      aboutGather: body.aboutGather ?? current.aboutGather,
      whyGatherCards: Array.isArray(body.whyGatherCards) ? body.whyGatherCards : current.whyGatherCards,
      updatedAt: new Date().toISOString(),
    }

    writeJson(FILE, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

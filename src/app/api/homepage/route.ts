import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { HomepageContent } from '@/types'

const FILE = 'homepage.json'

export async function GET() {
  const data = readJson<HomepageContent>(FILE)
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const auth = await requireAnyAdminPermission(['pages.write'])
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()
    const current = readJson<HomepageContent>(FILE)

    const updated: HomepageContent = {
      heroSlides: Array.isArray(body.heroSlides) ? body.heroSlides : current.heroSlides,
      heroText: body.heroText ?? current.heroText,
      aboutGather: body.aboutGather ?? current.aboutGather,
      whyGatherCards: Array.isArray(body.whyGatherCards) ? body.whyGatherCards : current.whyGatherCards,
      ar: body.ar ?? current.ar,
      updatedAt: new Date().toISOString(),
    }

    await writeJson(FILE, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

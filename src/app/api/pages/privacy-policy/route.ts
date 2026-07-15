import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { PolicyPageContent } from '@/types'

const FILE = 'privacy-policy.json'

export async function GET() {
  const data = readJson<PolicyPageContent>(FILE)
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const current = readJson<PolicyPageContent>(FILE)

    const updated: PolicyPageContent = {
      pageTitle: body.pageTitle ?? current.pageTitle,
      titleAr: body.titleAr ?? current.titleAr,
      content: body.content ?? current.content,
      contentAr: body.contentAr ?? current.contentAr,
      updatedAt: new Date().toISOString(),
    }

    await writeJson(FILE, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

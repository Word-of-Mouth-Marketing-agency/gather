import { NextResponse } from 'next/server'
import { readJson, writeJson } from '@/lib/db'
import type { PolicyPageContent } from '@/types'

const FILE = 'refund-returns.json'

export async function GET() {
  const data = readJson<PolicyPageContent>(FILE)
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const current = readJson<PolicyPageContent>(FILE)

    const updated: PolicyPageContent = {
      pageTitle: body.pageTitle ?? current.pageTitle,
      content: body.content ?? current.content,
      updatedAt: new Date().toISOString(),
    }

    writeJson(FILE, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
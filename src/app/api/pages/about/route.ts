import { NextResponse } from 'next/server'
import { readJson, writeJson } from '@/lib/db'
import type { AboutPageContent } from '@/types'

const FILE = 'about.json'

export async function GET() {
  const data = readJson<AboutPageContent>(FILE)
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const current = readJson<AboutPageContent>(FILE)

    const updated: AboutPageContent = {
      pageTitle: body.pageTitle ?? current.pageTitle,
      section1: body.section1 ?? current.section1,
      section2: body.section2 ?? current.section2,
      section2ListItems: Array.isArray(body.section2ListItems) ? body.section2ListItems : current.section2ListItems,
      updatedAt: new Date().toISOString(),
    }

    writeJson(FILE, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}
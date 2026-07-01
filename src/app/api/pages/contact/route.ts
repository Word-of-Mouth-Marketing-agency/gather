import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { ContactPageContent } from '@/types'

const FILE = 'contact.json'

export async function GET() {
  const data = readJson<ContactPageContent>(FILE)
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const body = await request.json()
    const current = readJson<ContactPageContent>(FILE)

    const updated: ContactPageContent = {
      pageTitle: body.pageTitle ?? current.pageTitle,
      infoTitle: body.infoTitle ?? current.infoTitle,
      infoBody: body.infoBody ?? current.infoBody,
      formTitle: body.formTitle ?? current.formTitle,
      recipientEmail: body.recipientEmail ?? current.recipientEmail,
      whatsappNumber: body.whatsappNumber ?? current.whatsappNumber,
      socialLinks: body.socialLinks ?? current.socialLinks,
      ar: body.ar ?? current.ar,
      updatedAt: new Date().toISOString(),
    }

    writeJson(FILE, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

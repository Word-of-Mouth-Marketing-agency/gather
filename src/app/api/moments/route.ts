import { NextResponse } from 'next/server'
import { readJson, writeJson, generateId } from '@/lib/db'
import { validateImageUpload } from '@/lib/upload-validation'
import type { MomentSubmission } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const showInSlider = searchParams.get('showInSlider')

  let items = readJson<MomentSubmission[]>('moments.json')

  if (status) {
    items = items.filter((m) => m.status === status)
  }

  if (showInSlider === 'true') {
    items = items.filter((m) => m.showInSlider)
  }

  return NextResponse.json(items)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const name = formData.get('name') as string | null
    const email = formData.get('email') as string | null
    const phone = formData.get('phone') as string | null
    const occasionType = formData.get('occasionType') as string | null
    const consent = formData.get('consent') as string | null
    const file = formData.get('image') as File | null

    if (!name || !occasionType || consent !== 'true') {
      return NextResponse.json({ error: 'Name, occasion, and consent are required' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const validation = validateImageUpload(file)
    if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')

    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'moments')
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_{2,}/g, '_')
    const filename = `${Date.now()}-${safeName}${validation.extension}`
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(baseDir, filename), buffer)

    const submission: MomentSubmission = {
      id: generateId('moment'),
      name,
      email: email || undefined,
      phone: phone || undefined,
      occasionType,
      imageUrl: `/uploads/moments/${filename}`,
      status: 'pending',
      showInSlider: false,
      submittedAt: new Date().toISOString(),
    }

    const items = readJson<MomentSubmission[]>('moments.json')
    items.unshift(submission)
    writeJson('moments.json', items)

    return NextResponse.json({ success: true, submission }, { status: 201 })
  } catch (err) {
    console.error('Moments submit error:', err)
    return NextResponse.json({ error: 'Failed to submit moment' }, { status: 500 })
  }
}

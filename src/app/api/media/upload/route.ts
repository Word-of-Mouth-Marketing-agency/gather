import { NextResponse } from 'next/server'
import { readJson, writeJson } from '@/lib/db'
import type { MediaAsset } from '@/types'

export async function GET() {
  const items = readJson<MediaAsset[]>('media.json')
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const ext = path.extname(file.name)
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(uploadsDir, filename), buffer)

    const asset: MediaAsset = {
      id: `media-${Date.now()}`,
      filename: file.name,
      url: `/uploads/${filename}`,
      alt: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    }

    const items = readJson<MediaAsset[]>('media.json')
    items.unshift(asset)
    writeJson('media.json', items)

    return NextResponse.json(asset, { status: 201 })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

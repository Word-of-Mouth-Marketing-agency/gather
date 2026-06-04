import { NextResponse } from 'next/server'
import { readJson, writeJson } from '@/lib/db'
import type { MediaAsset } from '@/types'

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const items = readJson<MediaAsset[]>('media.json')
    const idx = items.findIndex((m) => m.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    items.splice(idx, 1)
    writeJson('media.json', items)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

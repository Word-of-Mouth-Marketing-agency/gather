import { NextResponse } from 'next/server'
import { requireAnyAdminPermission } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { MediaAsset } from '@/types'

export async function DELETE(request: Request) {
  const auth = await requireAnyAdminPermission(['media.upload'])
  if (auth instanceof NextResponse) return auth

  try {
    const { id } = await request.json()
    const items = readJson<MediaAsset[]>('media.json')
    const idx = items.findIndex((m) => m.id === id)
    if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    items.splice(idx, 1)
    await writeJson('media.json', items)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

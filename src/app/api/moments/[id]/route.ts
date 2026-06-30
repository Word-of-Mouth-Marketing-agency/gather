import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { readJson, writeJson } from '@/lib/db'
import type { MomentSubmission } from '@/types'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()
    const items = readJson<MomentSubmission[]>('moments.json')
    const index = items.findIndex((m) => m.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    const updated: MomentSubmission = {
      ...items[index],
      ...body,
    }

    if ('status' in body && body.status === 'rejected') {
      updated.showInSlider = false
    }

    if ('showInSlider' in body && body.showInSlider && updated.status !== 'approved') {
      updated.showInSlider = false
    }

    if ('status' in body) {
      updated.reviewedAt = new Date().toISOString()
    }

    items[index] = updated
    writeJson('moments.json', items)

    return NextResponse.json({ success: true, submission: updated })
  } catch (err) {
    console.error('Moments update error:', err)
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const items = readJson<MomentSubmission[]>('moments.json')
    const index = items.findIndex((m) => m.id === id)

    if (index === -1) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')

    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads', 'moments')
    const imagePath = path.resolve(process.cwd(), 'public', items[index].imageUrl.replace(/^\/+/, ''))
    try {
      if (imagePath.startsWith(uploadsDir) && fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    } catch {
      // ignore file deletion errors
    }

    items.splice(index, 1)
    writeJson('moments.json', items)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Moments delete error:', err)
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 })
  }
}

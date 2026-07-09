import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getCategoryRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncCategoryById } from '@/lib/odoo/category-sync'

export async function GET() {
  const repo = getCategoryRepository()
  return NextResponse.json(repo.getAll())
}

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const data = await request.json()
    const repo = getCategoryRepository()
    const item = repo.create(data)
    if (isOdooSyncEnabled()) {
      syncCategoryById(item.id)
    }
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

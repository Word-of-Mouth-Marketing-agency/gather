import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getProductRepository } from '@/lib/repositories'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { syncProductById, pushDeleteToOdoo } from '@/lib/odoo/product-sync'
import { readJson, writeJson } from '@/lib/db'
import type { Product, MediaAsset, Bundle, Category, Review } from '@/types'

function logOp(op: string, id: string, sku?: string, extra?: string) {
  const ts = new Date().toISOString()
  console.log(`[PRODUCT_${op}] id=${id}${sku ? ` sku=${sku}` : ''}${extra ? ` ${extra}` : ''} ts=${ts}`)
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const repo = getProductRepository()
  const includeArchived = new URL(request.url).searchParams.get('includeArchived') === 'true'
  const product = repo.getById(id, includeArchived)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

function normalizeSku(sku: unknown): string {
  return String(sku ?? '').trim().toUpperCase()
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const data = await request.json()
  if (data.discountStartsAt && data.discountEndsAt && data.discountEndsAt < data.discountStartsAt) {
    return NextResponse.json({ error: 'Discount end date cannot be before start date' }, { status: 400 })
  }

  const sku = data.sku !== undefined ? normalizeSku(data.sku) : undefined
  if (sku !== undefined) {
    const repo = getProductRepository()
    const all = repo.getAll(true)
    const dup = all.find((p) => p.sku?.trim().toUpperCase() === sku && p.id !== id)
    if (dup) return NextResponse.json({ error: `SKU "${sku}" is already used by product "${dup.name}".` }, { status: 400 })
  }

  const repo = getProductRepository()
  const oldProduct = repo.getById(id, true)
  const stockChanged = oldProduct && data.stock !== undefined && data.stock !== oldProduct.stock

  const updated = repo.update(id, sku !== undefined ? { ...data, sku } : data)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logOp('UPDATE', id, sku ?? updated.sku, `name="${updated.name}" stockChanged=${stockChanged}`)

  let syncResult
  if (isOdooSyncEnabled()) {
    const startMs = Date.now()
    try {
      syncResult = await syncProductById(id, stockChanged)
      logOp('UPDATE', id, sku ?? updated.sku, `odoo_sync=${syncResult.syncStatus} ${Date.now() - startMs}ms`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      syncResult = { syncStatus: 'sync_failed' as const, syncError: msg.slice(0, 500) }
      logOp('UPDATE', id, sku ?? updated.sku, `odoo_sync=error ${Date.now() - startMs}ms error="${msg.slice(0, 200)}"`)
    }
  }

  return NextResponse.json({ ...updated, odooSync: syncResult })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  const { id } = await params
  const repo = getProductRepository()

  const product = repo.getById(id, true)
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  logOp('DELETE', id, product.sku, `name="${product.name}" odooProductId=${product.odooProductId ?? 'none'}`)

  // 1. Delete from Odoo first (product still exists locally for lookup).
  //    Wrap in try-catch so Odoo failures never block local deletion.
  let odooDeleteOutcome: { odooResult: string; warning?: string } | undefined
  if (isOdooSyncEnabled()) {
    try {
      odooDeleteOutcome = await pushDeleteToOdoo(id)
      logOp('DELETE', id, product.sku, `odoo_delete=${odooDeleteOutcome.odooResult}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logOp('DELETE', id, product.sku, `odoo_delete=failed error="${msg.slice(0, 200)}"`)
    }
  }

  // 2. Clean up product image files from disk
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  for (const imageUrl of product.images ?? []) {
    const relative = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl
    const filePath = path.join(process.cwd(), 'public', relative)
    try {
      if (filePath.startsWith(uploadsDir) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch { /* ignore file cleanup errors */ }
  }

  // 3. Clean up media.json entries for this product's images
  try {
    const allMedia = readJson<MediaAsset[]>('media.json')
    const imageUrls = new Set(product.images ?? [])
    const remaining = allMedia.filter((m) => !imageUrls.has(m.url))
    writeJson('media.json', remaining)
  } catch { /* ignore media cleanup errors */ }

  // 4. Cascade: remove this product's ID from cross-sell / FBT of other products
  try {
    const allProducts = readJson<Product[]>('products.json')
    let productsDirty = false
    for (const other of allProducts) {
      if (other.id === id) continue
      if (other.crossSellIds?.includes(id)) {
        other.crossSellIds = other.crossSellIds.filter((x) => x !== id)
        productsDirty = true
      }
      if (other.frequentlyBoughtTogetherIds?.includes(id)) {
        other.frequentlyBoughtTogetherIds = other.frequentlyBoughtTogetherIds.filter((x) => x !== id)
        productsDirty = true
      }
    }
    if (productsDirty) writeJson('products.json', allProducts)
  } catch { /* ignore cross-sell cleanup errors */ }

  // 5. Cascade: remove this product's ID from bundles
  try {
    const bundles = readJson<Bundle[]>('bundles.json')
    let bundlesDirty = false
    for (const bundle of bundles) {
      if (bundle.productIds.includes(id)) {
        bundle.productIds = bundle.productIds.filter((pid) => pid !== id)
        bundlesDirty = true
      }
    }
    if (bundlesDirty) writeJson('bundles.json', bundles)
  } catch { /* ignore bundle cleanup errors */ }

  // 6. Cascade: remove this product's ID from category topProductIds
  try {
    const categories = readJson<Category[]>('categories.json')
    let catDirty = false
    for (const cat of categories) {
      if (cat.topProductIds?.includes(id)) {
        cat.topProductIds = cat.topProductIds.filter((pid) => pid !== id)
        catDirty = true
      }
    }
    if (catDirty) writeJson('categories.json', categories)
  } catch { /* ignore category cleanup errors */ }

  // 7. Cascade: remove reviews for this product
  try {
    const reviews = readJson<Review[]>('reviews.json')
    const remainingReviews = reviews.filter((r) => r.productId !== id)
    if (remainingReviews.length !== reviews.length) {
      writeJson('reviews.json', remainingReviews)
    }
  } catch { /* ignore review cleanup errors */ }

  // 8. Hard delete the product from products.json
  repo.delete(id)
  logOp('DELETE', id, product.sku, 'local_delete=success')

  const responseBody: Record<string, unknown> = { localDeleted: true }
  if (odooDeleteOutcome) {
    responseBody.odooResult = odooDeleteOutcome.odooResult
    if (odooDeleteOutcome.warning) responseBody.warning = odooDeleteOutcome.warning
  }
  return NextResponse.json(responseBody)
}

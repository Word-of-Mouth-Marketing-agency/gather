import type { Category } from '@/types'
import { readJson, writeJson } from '@/lib/db'
import { getOdooConfig, odooSearchRead, odooCreate, odooWrite } from './json-rpc'

const CATEGORIES_FILE = 'categories.json'

export interface CategorySyncResult {
  created: number
  updated: number
  skippedOccasions: number
  failed: number
  warnings: string[]
  errors: Record<string, string>
  timestamp: string
}

function now(): string {
  return new Date().toISOString()
}

function loadCategories(): Category[] {
  return readJson<Category[]>(CATEGORIES_FILE)
}

function saveCategories(items: Category[]): void {
  writeJson(CATEGORIES_FILE, items)
}

export async function syncCategoriesToOdoo(): Promise<CategorySyncResult> {
  const config = getOdooConfig()
  if (!config) {
    throw new Error(
      'Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, and ODOO_PASSWORD in your .env.local file.',
    )
  }

  const result: CategorySyncResult = {
    created: 0,
    updated: 0,
    skippedOccasions: 0,
    failed: 0,
    warnings: [],
    errors: {},
    timestamp: now(),
  }

  const allItems = loadCategories()

  const categoryItems = allItems.filter((item) => item.type === 'category')
  const occasionItems = allItems.filter((item) => item.type === 'occasion')
  result.skippedOccasions = occasionItems.length

  const odooCategoryMap = new Map<string, number>()

  for (const cat of categoryItems) {
    try {
      const { odooId, action } = await syncSingleCategory(cat, categoryItems, odooCategoryMap, result.warnings)
      odooCategoryMap.set(cat.id, odooId)
      if (action === 'created') result.created += 1
      else result.updated += 1
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      result.errors[cat.id] = message
      result.failed += 1

      const idx = allItems.findIndex((i) => i.id === cat.id)
      if (idx >= 0) {
        allItems[idx] = {
          ...allItems[idx],
          syncStatus: 'sync_failed',
          syncError: message.slice(0, 500),
          lastSyncedAt: now(),
        }
      }
    }
  }

  if (result.created > 0 || result.updated > 0 || result.failed > 0) {
    saveCategories(allItems)
  }

  return result
}

async function syncSingleCategory(
  cat: Category,
  allCategories: Category[],
  syncedMap: Map<string, number>,
  warnings: string[],
): Promise<{ odooId: number; action: 'created' | 'updated' }> {
  let odooId: number | undefined

  if (cat.odooCategoryId) {
    const existing = await odooSearchRead('product.category', [['id', '=', cat.odooCategoryId]], ['id'], 1)
    if (existing.length > 0) {
      odooId = existing[0].id as number
    }
  }

  if (!odooId) {
    const byNextjsId = await odooSearchRead('product.category', [['x_nextjs_id', '=', cat.id]], ['id'], 1)
    if (byNextjsId.length > 0) {
      odooId = byNextjsId[0].id as number
    }
  }

  if (!odooId) {
    const bySlug = await odooSearchRead('product.category', [['x_slug', '=', cat.slug]], ['id'], 1)
    if (bySlug.length > 0) {
      odooId = bySlug[0].id as number
    }
  }

  const values: Record<string, unknown> = {
    name: cat.name,
    x_slug: cat.slug,
    x_nextjs_id: cat.id,
  }

  const parentOdooId = resolveParentOdooId(cat, allCategories, syncedMap)
  if (parentOdooId !== undefined) {
    values.parent_id = parentOdooId
  } else if (cat.parentId) {
    values.parent_id = false
    warnings.push(`Category "${cat.name}" (${cat.id}): parent "${cat.parentId}" not found, syncing without parent`)
  }

  let action: 'created' | 'updated'
  if (odooId) {
    await odooWrite('product.category', odooId, values)
    action = 'updated'
  } else {
    odooId = await odooCreate('product.category', values)
    action = 'created'
  }

  const allItems = loadCategories()
  const idx = allItems.findIndex((i) => i.id === cat.id)
  if (idx >= 0) {
    allItems[idx] = {
      ...allItems[idx],
      odooCategoryId: odooId,
      syncStatus: 'synced',
      syncError: undefined,
      lastSyncedAt: now(),
    }
    saveCategories(allItems)
  }

  return { odooId, action }
}

function resolveParentOdooId(
  cat: Category,
  allCategories: Category[],
  syncedMap: Map<string, number>,
): number | undefined {
  if (!cat.parentId) return undefined

  const cached = syncedMap.get(cat.parentId)
  if (cached) return cached

  const parent = allCategories.find((c) => c.id === cat.parentId)
  if (parent?.odooCategoryId) return parent.odooCategoryId

  return undefined
}

export async function syncCategoryById(categoryId: string): Promise<void> {
  const config = getOdooConfig()
  if (!config) return

  try {
    const allItems = loadCategories()
    const cat = allItems.find((c) => c.id === categoryId)
    if (!cat || cat.type !== 'category') return

    const odooMap = new Map<string, number>()
    const warnings: string[] = []
    const { odooId } = await syncSingleCategory(cat, allItems, odooMap, warnings)

    const all = loadCategories()
    const idx = all.findIndex((c) => c.id === categoryId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], odooCategoryId: odooId, syncStatus: 'synced', syncError: undefined, lastSyncedAt: now() }
      saveCategories(all)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const all = loadCategories()
    const idx = all.findIndex((c) => c.id === categoryId)
    if (idx >= 0) {
      all[idx] = { ...all[idx], syncStatus: 'sync_failed', syncError: message.slice(0, 500), lastSyncedAt: now() }
      saveCategories(all)
    }
  }
}

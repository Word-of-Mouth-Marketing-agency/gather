import type { Category } from '@/types'
import { readJson } from './db'

const CATEGORIES_FILE = 'categories.json'

function categorySortOrder(category: Category): number {
  return category.sortOrder ?? category.order ?? 0
}

export function getAllTaxonomies(): Category[] {
  try {
    return readJson<Category[]>(CATEGORIES_FILE)
  } catch {
    return []
  }
}

export function getActiveTaxonomiesByType(type: 'category' | 'occasion', limit?: number): Category[] {
  const items = getAllTaxonomies()
    .filter((item) => item.type === type)
    .filter((item) => item.isActive !== false)
    .sort((a, b) => categorySortOrder(a) - categorySortOrder(b))

  return limit ? items.slice(0, limit) : items
}

export function getTaxonomyBySlug(slug: string): Category | undefined {
  return getAllTaxonomies().find((item) => item.slug === slug)
}

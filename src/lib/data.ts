import type { Product, Category, Page, Bundle } from '@/types'
import productsData from '@/data/products.json'
import categoriesData from '@/data/categories.json'
import pagesData from '@/data/pages.json'
import bundlesData from '@/data/bundles.json'

const STATIC_PRODUCTS = productsData as Product[]
const STATIC_CATEGORIES = categoriesData as Category[]
const STATIC_PAGES = pagesData as Page[]
const STATIC_BUNDLES = bundlesData as Bundle[]

const cache: Record<string, { data: unknown; ts: number }> = {}
const CACHE_TTL = 2000

function categorySortOrder(category: Category): number {
  return category.sortOrder ?? category.order ?? 0
}

function readCached<T>(key: string, staticFallback: T, filename: string): T {
  const cached = cache[key]
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const raw = fs.readFileSync(path.join(process.cwd(), 'src', 'data', filename), 'utf-8')
    const data = JSON.parse(raw) as T
    cache[key] = { data, ts: Date.now() }
    return data
  } catch {
    return staticFallback
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function getAllProducts(): Product[] {
  return readCached<Product[]>('products', STATIC_PRODUCTS, 'products.json')
}

export function getProductBySlug(slug: string): Product | undefined {
  return getAllProducts().find((p) => p.slug === slug)
}

export function getProductById(id: string): Product | undefined {
  return getAllProducts().find((p) => p.id === id)
}

export function getFeaturedProducts(limit?: number): Product[] {
  const featured = getAllProducts().filter((p) => p.featured)
  return limit ? featured.slice(0, limit) : featured
}

export function getProductsByCategory(categoryId: string, limit?: number): Product[] {
  const filtered = getAllProducts().filter((p) => p.categoryIds.includes(categoryId))
  return limit ? filtered.slice(0, limit) : filtered
}

export function getProductsByOccasion(occasionId: string, limit?: number): Product[] {
  const filtered = getAllProducts().filter((p) => p.occasionIds.includes(occasionId))
  return limit ? filtered.slice(0, limit) : filtered
}

export function getCrossSellProducts(productId: string): Product[] {
  const product = getProductById(productId)
  if (!product) return []
  return product.crossSellIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => p !== undefined)
}

// ─── Categories ───────────────────────────────────────────────────────────────

export function getAllCategories(): Category[] {
  return readCached<Category[]>('categories', STATIC_CATEGORIES, 'categories.json')
}

export function getCategoriesByType(type: 'category' | 'occasion', limit?: number): Category[] {
  const filtered = getAllCategories()
    .filter((c) => c.type === type)
    .filter((c) => c.isActive !== false)
    .sort((a, b) => categorySortOrder(a) - categorySortOrder(b))
  return limit ? filtered.slice(0, limit) : filtered
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return getAllCategories().find((c) => c.slug === slug)
}

export function getCategoryById(id: string): Category | undefined {
  return getAllCategories().find((c) => c.id === id)
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export function getAllPages(): Page[] {
  return readCached<Page[]>('pages', STATIC_PAGES, 'pages.json')
}

export function getPageBySlug(slug: string): Page | undefined {
  return getAllPages().find((p) => p.slug === slug)
}

export function getPageById(id: string): Page | undefined {
  return getAllPages().find((p) => p.id === id)
}

// ─── Bundles ───────────────────────────────────────────────────────────────────

export function getAllBundles(): Bundle[] {
  return readCached<Bundle[]>('bundles', STATIC_BUNDLES, 'bundles.json')
}

export function getBundleById(id: string): Bundle | undefined {
  return getAllBundles().find((b) => b.id === id)
}

export function getBundleProducts(bundle: Bundle): Product[] {
  return bundle.productIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => p !== undefined)
}

// ─── Price helpers ────────────────────────────────────────────────────────────

export function formatPrice(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString('en-EG')} ${currency}`
}

export function getDisplayPrice(product: Product): number {
  return product.salePrice ?? product.price
}

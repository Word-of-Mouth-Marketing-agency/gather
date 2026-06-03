import type { Product, Category, Page } from '@/types'
import productsData from '@/data/products.json'
import categoriesData from '@/data/categories.json'
import pagesData from '@/data/pages.json'

// Cast JSON to typed arrays
const products = productsData as Product[]
const categories = categoriesData as Category[]
const pages = pagesData as Page[]

// ─── Products ─────────────────────────────────────────────────────────────────

export function getAllProducts(): Product[] {
  return products
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

export function getFeaturedProducts(limit?: number): Product[] {
  const featured = products.filter((p) => p.featured)
  return limit ? featured.slice(0, limit) : featured
}

export function getProductsByCategory(categoryId: string, limit?: number): Product[] {
  const filtered = products.filter((p) => p.categoryIds.includes(categoryId))
  return limit ? filtered.slice(0, limit) : filtered
}

export function getProductsByOccasion(occasionId: string, limit?: number): Product[] {
  const filtered = products.filter((p) => p.occasionIds.includes(occasionId))
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
  return categories
}

export function getCategoriesByType(type: 'category' | 'occasion', limit?: number): Category[] {
  const filtered = categories
    .filter((c) => c.type === type)
    .sort((a, b) => a.order - b.order)
  return limit ? filtered.slice(0, limit) : filtered
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function getCategoryById(id: string): Category | undefined {
  return categories.find((c) => c.id === id)
}

// ─── Pages ────────────────────────────────────────────────────────────────────

export function getAllPages(): Page[] {
  return pages
}

export function getPageBySlug(slug: string): Page | undefined {
  return pages.find((p) => p.slug === slug)
}

export function getPageById(id: string): Page | undefined {
  return pages.find((p) => p.id === id)
}

// ─── Price helpers ────────────────────────────────────────────────────────────

export function formatPrice(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString('en-EG')} ${currency}`
}

export function getDisplayPrice(product: Product): number {
  return product.salePrice ?? product.price
}

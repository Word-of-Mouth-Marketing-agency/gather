import type { Product, Category, Page, Bundle, HomepageContent, AboutPageContent, ContactPageContent, PolicyPageContent, Review } from '@/types'
import productsData from '@/data/products.json'
import categoriesData from '@/data/categories.json'
import pagesData from '@/data/pages.json'
import bundlesData from '@/data/bundles.json'
import homepageData from '@/data/homepage.json'
import aboutData from '@/data/about.json'
import contactData from '@/data/contact.json'
import privacyPolicyData from '@/data/privacy-policy.json'
import refundReturnsData from '@/data/refund-returns.json'
import reviewsData from '@/data/reviews.json'
import { getActiveProductPrice, isBundlePurchasable } from './scheduled-discounts'

const STATIC_PRODUCTS = productsData as Product[]
const STATIC_CATEGORIES = categoriesData as Category[]
const STATIC_PAGES = pagesData as Page[]
const STATIC_BUNDLES = bundlesData as Bundle[]
const STATIC_HOMEPAGE = homepageData as HomepageContent
const STATIC_ABOUT = aboutData as AboutPageContent
const STATIC_CONTACT = contactData as ContactPageContent
const STATIC_PRIVACY_POLICY = privacyPolicyData as PolicyPageContent
const STATIC_REFUND_RETURNS = refundReturnsData as PolicyPageContent
const STATIC_REVIEWS = reviewsData as Review[]

function categorySortOrder(category: Category): number {
  return category.sortOrder ?? category.order ?? 0
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function getAllProducts(): Product[] {
  return STATIC_PRODUCTS
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
  return STATIC_CATEGORIES
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
  return STATIC_PAGES
}

export function getPageBySlug(slug: string): Page | undefined {
  return getAllPages().find((p) => p.slug === slug)
}

export function getPageById(id: string): Page | undefined {
  return getAllPages().find((p) => p.id === id)
}

// ─── Bundles ───────────────────────────────────────────────────────────────────

export function getAllBundles(): Bundle[] {
  return STATIC_BUNDLES
}

export function getActiveBundles(): Bundle[] {
  return getAllBundles().filter((bundle) => isBundlePurchasable(bundle))
}

export function getBundleById(id: string): Bundle | undefined {
  return getAllBundles().find((b) => b.id === id)
}

export function getBundleProducts(bundle: Bundle): Product[] {
  const uniqueIds = [...new Set(bundle.productIds)]
  return uniqueIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => p !== undefined)
}

// ─── Price helpers ────────────────────────────────────────────────────────────

export function formatPrice(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString('en-EG')} ${currency}`
}

export function getDisplayPrice(product: Product): number {
  return getActiveProductPrice(product)
}

// ─── Homepage Content ─────────────────────────────────────────────────────────

export function getHomepageContent(): HomepageContent {
  return STATIC_HOMEPAGE
}

// ─── About Page Content ───────────────────────────────────────────────────────

export function getAboutPageContent(): AboutPageContent {
  return STATIC_ABOUT
}

// ─── Contact Page Content ─────────────────────────────────────────────────────

export function getContactPageContent(): ContactPageContent {
  return STATIC_CONTACT
}

// ─── Privacy Policy Page Content ──────────────────────────────────────────────

export function getPrivacyPolicyContent(): PolicyPageContent {
  return STATIC_PRIVACY_POLICY
}

// ─── Refund & Returns Page Content ────────────────────────────────────────────

export function getRefundReturnsContent(): PolicyPageContent {
  return STATIC_REFUND_RETURNS
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export function getAllReviews(): Review[] {
  return STATIC_REVIEWS
}

export function getApprovedVisibleReviews(productId: string): Review[] {
  return STATIC_REVIEWS.filter(
    (r) => r.productId === productId && r.status === 'approved' && r.isVisible
  )
}

export function getProductReviewSummary(productId: string): {
  averageRating: number | null
  reviewCount: number
} {
  const reviews = getApprovedVisibleReviews(productId)
  if (reviews.length === 0) {
    return { averageRating: null, reviewCount: 0 }
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return { averageRating: sum / reviews.length, reviewCount: reviews.length }
}

// ─── Locale-aware helpers ─────────────────────────────────────────────────────

export function locName(product: Product, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar' && product.nameAr) return product.nameAr
  return product.name
}

export function locDesc(product: Product, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar' && product.descriptionAr) return product.descriptionAr
  return product.description
}

export function locShortDesc(product: Product, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar' && product.shortDescriptionAr) return product.shortDescriptionAr
  return product.shortDescription
}

export function locCatName(cat: Category, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar' && cat.nameAr) return cat.nameAr
  return cat.name
}

export function locBundleName(bundle: Bundle, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar' && bundle.nameAr) return bundle.nameAr
  return bundle.name
}

export function locBundleDesc(bundle: Bundle, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar' && bundle.descriptionAr) return bundle.descriptionAr
  return bundle.description ?? ''
}

export function locBundleBadge(bundle: Bundle, locale: 'en' | 'ar' = 'en'): string | undefined {
  if (locale === 'ar' && bundle.badgeAr) return bundle.badgeAr
  return bundle.badge
}

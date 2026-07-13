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

const PRODUCTS_FILE = 'products.json'
const CATEGORIES_FILE = 'categories.json'
const PAGES_FILE = 'pages.json'
const BUNDLES_FILE = 'bundles.json'
const HOMEPAGE_FILE = 'homepage.json'
const ABOUT_FILE = 'about.json'
const CONTACT_FILE = 'contact.json'
const PRIVACY_FILE = 'privacy-policy.json'
const REFUND_FILE = 'refund-returns.json'
const REVIEWS_FILE = 'reviews.json'

const PRODUCTS_SNAPSHOT = productsData as Product[]
const CATEGORIES_SNAPSHOT = categoriesData as Category[]
const PAGES_SNAPSHOT = pagesData as Page[]
const BUNDLES_SNAPSHOT = bundlesData as Bundle[]
const HOMEPAGE_SNAPSHOT = homepageData as HomepageContent
const ABOUT_SNAPSHOT = aboutData as AboutPageContent
const CONTACT_SNAPSHOT = contactData as ContactPageContent
const PRIVACY_SNAPSHOT = privacyPolicyData as PolicyPageContent
const REFUND_SNAPSHOT = refundReturnsData as PolicyPageContent
const REVIEWS_SNAPSHOT = reviewsData as Review[]

let _serverReadJson: (<T>(filename: string) => T) | null = null

if (typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('node:path')
    const DATA_DIR = path.join(process.cwd(), 'src', 'data')
    _serverReadJson = function <T>(filename: string): T {
      const filePath = path.join(DATA_DIR, filename)
      const raw = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.warn('[data.ts] Server JSON reader init failed:', e)
  }
}

function tryReadJson<T>(filename: string, fallback: T): T {
  if (_serverReadJson) {
    try {
      return _serverReadJson<T>(filename)
    } catch (e) {
      console.warn(`[data.ts] Failed to read ${filename} from disk:`, e)
      return fallback
    }
  }
  return fallback
}

function getProductsData(): Product[] {
  return tryReadJson<Product[]>(PRODUCTS_FILE, PRODUCTS_SNAPSHOT)
}

function getCategoriesData(): Category[] {
  return tryReadJson<Category[]>(CATEGORIES_FILE, CATEGORIES_SNAPSHOT)
}

function getPagesData(): Page[] {
  return tryReadJson<Page[]>(PAGES_FILE, PAGES_SNAPSHOT)
}

function getBundlesData(): Bundle[] {
  return tryReadJson<Bundle[]>(BUNDLES_FILE, BUNDLES_SNAPSHOT)
}

function getHomepageData(): HomepageContent {
  return tryReadJson<HomepageContent>(HOMEPAGE_FILE, HOMEPAGE_SNAPSHOT)
}

function getAboutData(): AboutPageContent {
  return tryReadJson<AboutPageContent>(ABOUT_FILE, ABOUT_SNAPSHOT)
}

function getContactData(): ContactPageContent {
  return tryReadJson<ContactPageContent>(CONTACT_FILE, CONTACT_SNAPSHOT)
}

function getPrivacyData(): PolicyPageContent {
  return tryReadJson<PolicyPageContent>(PRIVACY_FILE, PRIVACY_SNAPSHOT)
}

function getRefundData(): PolicyPageContent {
  return tryReadJson<PolicyPageContent>(REFUND_FILE, REFUND_SNAPSHOT)
}

function getReviewsData(): Review[] {
  return tryReadJson<Review[]>(REVIEWS_FILE, REVIEWS_SNAPSHOT)
}

function categorySortOrder(category: Category): number {
  return category.sortOrder ?? category.order ?? 0
}

function filterActive(products: Product[], includeArchived = false): Product[] {
  if (includeArchived) return products
  return products.filter((p) => p.isActive !== false)
}

export function getAllProducts(includeArchived = false): Product[] {
  return filterActive(getProductsData(), includeArchived)
}

export function getProductBySlug(slug: string, includeArchived = false): Product | undefined {
  return getAllProducts(includeArchived).find((p) => p.slug === slug)
}

export function getProductById(id: string, includeArchived = false): Product | undefined {
  return getAllProducts(includeArchived).find((p) => p.id === id)
}

export function getFeaturedProducts(limit?: number, includeArchived = false): Product[] {
  const featured = getAllProducts(includeArchived).filter((p) => p.featured)
  return limit ? featured.slice(0, limit) : featured
}

export function getProductsByCategory(categoryId: string, limit?: number, includeArchived = false): Product[] {
  const filtered = getAllProducts(includeArchived).filter((p) => p.categoryIds.includes(categoryId))
  return limit ? filtered.slice(0, limit) : filtered
}

export function getProductsByOccasion(occasionId: string, limit?: number, includeArchived = false): Product[] {
  const filtered = getAllProducts(includeArchived).filter((p) => p.occasionIds.includes(occasionId))
  return limit ? filtered.slice(0, limit) : filtered
}

export function getCrossSellProducts(productId: string, includeArchived = false): Product[] {
  const product = getProductById(productId, includeArchived)
  if (!product) return []
  return product.crossSellIds
    .map((id) => getProductById(id, includeArchived))
    .filter((p): p is Product => p !== undefined)
}

export function getAllCategories(): Category[] {
  return getCategoriesData()
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

export function getAllPages(): Page[] {
  return getPagesData()
}

export function getPageBySlug(slug: string): Page | undefined {
  return getAllPages().find((p) => p.slug === slug)
}

export function getPageById(id: string): Page | undefined {
  return getAllPages().find((p) => p.id === id)
}

export function getAllBundles(): Bundle[] {
  return getBundlesData()
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

export function formatPrice(amount: number, currency = 'EGP'): string {
  return `${amount.toLocaleString('en-EG')} ${currency}`
}

export function getDisplayPrice(product: Product): number {
  return getActiveProductPrice(product)
}

export function getHomepageContent(): HomepageContent {
  return getHomepageData()
}

export function getAboutPageContent(): AboutPageContent {
  return getAboutData()
}

export function getContactPageContent(): ContactPageContent {
  return getContactData()
}

export function getPrivacyPolicyContent(): PolicyPageContent {
  return getPrivacyData()
}

export function getRefundReturnsContent(): PolicyPageContent {
  return getRefundData()
}

export function getAllReviews(): Review[] {
  return getReviewsData()
}

export function getApprovedVisibleReviews(productId: string): Review[] {
  return getReviewsData().filter(
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

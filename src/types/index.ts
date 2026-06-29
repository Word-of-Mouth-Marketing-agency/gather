// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  shortDescription: string
  price: number
  salePrice: number | null
  currency: string
  images: string[]
  categoryIds: string[]
  occasionIds: string[]
  stock: number
  stockStatus?: string
  rating?: number
  reviewCount?: number
  reviews?: ProductReview[]
  crossSellIds: string[]
  featured: boolean
  createdAt: string
}

export interface ProductReview {
  id: string
  author: string
  rating: number
  title?: string
  body: string
  createdAt?: string
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: string
  slug: string
  name: string
  description: string
  image: string
  type: 'category' | 'occasion'
  parentId: string | null
  sortOrder: number
  isActive: boolean
  order?: number
}

// ─── Page Sections ─────────────────────────────────────────────────────────────

export type SectionType =
  | 'hero'
  | 'banner'
  | 'product-grid'
  | 'category-grid'
  | 'occasion-grid'
  | 'occasions'
  | 'text-block'
  | 'image-block'
  | 'moments-wall'
  | 'moments'
  | 'cta-banner'
  | 'offers-grid'
  | 'why-gather'
  | 'about-gather'

export interface HeroSectionProps {
  title: string
  subtitle: string
  ctaText: string
  ctaUrl: string
  image: string
  overlayOpacity?: number
}

export interface BannerSectionProps {
  title: string
  subtitle?: string
  ctaText?: string
  ctaUrl?: string
  image: string
  variant: 'full-width' | 'contained'
}

export interface ProductGridSectionProps {
  title: string
  subtitle?: string
  categoryId?: string
  occasionId?: string
  productIds?: string[]
  limit?: number
  showViewAll?: boolean
  viewAllUrl?: string
  slider?: boolean
}

export interface CategoryGridSectionProps {
  title: string
  subtitle?: string
  type: 'category' | 'occasion'
  limit?: number
}

export interface TextBlockSectionProps {
  title?: string
  content: string
  align?: 'left' | 'center' | 'right'
}

export interface ImageBlockSectionProps {
  src: string
  alt: string
  caption?: string
}

export interface MomentsWallSectionProps {
  title: string
  subtitle?: string
  limit?: number
}

export interface CtaBannerSectionProps {
  title: string
  subtitle?: string
  ctaText: string
  ctaUrl: string
  variant?: 'orange' | 'warm'
}

export interface OffersGridSectionProps {
  title: string
  subtitle?: string
}

export interface WhyGatherSectionProps {
  title: string
  subtitle?: string
}

export interface OccasionSectionProps {
  title: string
  subtitle?: string
  decorativeImage?: string
}

export interface AboutGatherSectionProps {
  title: string
  subtitle?: string
  body?: string
  ctaText: string
  ctaUrl: string
  leftImage: string
  rightImage: string
}

export interface MomentsSectionProps {
  title: string
  subtitle?: string
  images: string[]
  buttonText: string
  backgroundImage: string
}

type SectionPropsMap = {
  hero: HeroSectionProps
  banner: BannerSectionProps
  'product-grid': ProductGridSectionProps
  'category-grid': CategoryGridSectionProps
  'occasion-grid': CategoryGridSectionProps
  occasions: OccasionSectionProps
  'text-block': TextBlockSectionProps
  'image-block': ImageBlockSectionProps
  'moments-wall': MomentsWallSectionProps
  'moments': MomentsSectionProps
  'cta-banner': CtaBannerSectionProps
  'offers-grid': OffersGridSectionProps
  'why-gather': WhyGatherSectionProps
  'about-gather': AboutGatherSectionProps
}

export type Section<T extends SectionType = SectionType> = {
  id: string
  type: T
  props: SectionPropsMap[T]
  order: number
  visible: boolean
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export interface Page {
  id: string
  slug: string
  title: string
  metaDescription?: string
  sections: Section[]
  updatedAt: string
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface ProductCartItem {
  type: 'product'
  id: string
  productId: string
  name: string
  slug: string
  image?: string
  price: number
  compareAtPrice?: number
  currency: string
  quantity: number
}

export interface BundleCartItem {
  type: 'bundle'
  id: string
  bundleId: string
  name: string
  slug: string
  badge?: string
  image?: string
  price: number
  regularPrice?: number
  currency: string
  quantity: number
  productIds: string[]
  productsSnapshot: Array<{
    id: string
    name: string
    slug: string
    image?: string
    price: number
  }>
}

export type CartItem = ProductCartItem | BundleCartItem

// ─── Order ────────────────────────────────────────────────────────────────────

export type DeliverySlot =
  | '10:00-12:00'
  | '12:00-14:00'
  | '14:00-16:00'
  | '16:00-18:00'
  | '18:00-20:00'
  | '20:00-22:00'
  | 'outside-hours'

export interface ShippingFee {
  id: string
  city: string
  fee: number
  isActive: boolean
  sortOrder: number
}

export interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  address: string
  deliveryDate: string
  deliverySlot: DeliverySlot | ''
  orderNotes: string
  paymentMethod: 'cod' | 'card'
}

// ─── Media ────────────────────────────────────────────────────────────────────

export interface MediaAsset {
  id: string
  filename: string
  url: string
  alt: string
  mimeType: string
  size: number
  width?: number
  height?: number
  uploadedAt: string
}

// ─── Moment Submission ─────────────────────────────────────────────────────

export interface MomentSubmission {
  id: string
  name: string
  email?: string
  phone?: string
  occasionType: string
  imageUrl: string
  status: 'pending' | 'approved' | 'rejected'
  showInSlider: boolean
  submittedAt: string
  reviewedAt?: string
}

// ─── Bundle ─────────────────────────────────────────────────────────────────

export interface Bundle {
  id: string
  slug: string
  name: string
  badge?: string
  description?: string
  productIds: string[]
  regularPrice?: number
  offerPrice: number
  currency: string
  buttonText: string
  isActive: boolean
  isFeatured: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

// ─── Odoo Integration Interfaces (Phase 1 stubs) ─────────────────────────────

export interface OdooProduct {
  id: number
  name: string
  list_price: number
  standard_price: number
  qty_available: number
  categ_id: [number, string]
  description_sale: string | false
  image_1920: string | false
}

export interface OdooOrder {
  id: number
  name: string
  partner_id: [number, string]
  amount_total: number
  state: string
  order_line: OdooOrderLine[]
}

export interface OdooOrderLine {
  product_id: [number, string]
  product_uom_qty: number
  price_unit: number
  price_subtotal: number
}

export interface OdooSyncResult {
  success: boolean
  syncedAt: string
  errors: string[]
}

// ─── Customer / Auth ─────────────────────────────────────────────────────────

export interface Address {
  id: string
  label: string
  city: string
  street: string
  apartment?: string
  phone: string
  isDefault: boolean
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  password: string
  addresses: Address[]
  acceptedDataPolicy?: boolean
  acceptedTermsAndConditions?: boolean
  acceptedCustomerPoliciesAt?: string
  createdAt: string
}

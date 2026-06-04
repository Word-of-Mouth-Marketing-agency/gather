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
  crossSellIds: string[]
  featured: boolean
  createdAt: string
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
  order: number
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

export interface CartItem {
  productId: string
  quantity: number
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type DeliverySlot =
  | '10:00-12:00'
  | '12:00-14:00'
  | '14:00-16:00'
  | '16:00-18:00'
  | '18:00-20:00'
  | '20:00-22:00'
  | 'outside-hours'

export type AllowedCity = 'Dokki' | 'Mohandessin' | 'Manial' | 'Zamalek' | 'Haram'

export interface CheckoutFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: AllowedCity | ''
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

// ─── Bundle ─────────────────────────────────────────────────────────────────

export interface Bundle {
  id: string
  slug: string
  badge: string
  name: string
  description: string
  regularPrice: number
  offerPrice: number
  currency: string
  productIds: string[]
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

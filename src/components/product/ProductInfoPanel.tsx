'use client'

import { useState, useEffect, useSyncExternalStore } from 'react'
import Link from 'next/link'
import type { Category, Product } from '@/types'
import { addToCart } from '@/lib/cart'
import { formatPrice, getDisplayPrice } from '@/lib/data'
import { isProductDiscountActive } from '@/lib/scheduled-discounts'
import { isInWishlist, toggleWishlist } from '@/lib/wishlist'
import { useLocale } from '@/components/LocaleProvider'
import ProductRatingSummary from './ProductRatingSummary'

interface Props {
  product: Product
  categories: Category[]
  occasions: Category[]
  locale?: 'en' | 'ar'
}

export default function ProductInfoPanel({ product, categories, occasions, locale: localeProp }: Props) {
  const { locale, t } = useLocale()
  const resolvedLocale = localeProp ?? locale
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [reviewAvg, setReviewAvg] = useState<number | null | undefined>(undefined)
  const [reviewCount, setReviewCount] = useState<number | undefined>(undefined)
  const wishlisted = useSyncExternalStore(
    subscribeToWishlist,
    () => isInWishlist(product.id),
    () => false
  )

  useEffect(() => {
    let cancelled = false
    fetch(`/api/reviews?productId=${product.id}&status=approved&isVisible=true`)
      .then((r) => r.json())
      .then((reviews: Array<{ rating: number }>) => {
        if (cancelled) return
        if (reviews.length === 0) {
          setReviewAvg(null)
          setReviewCount(0)
        } else {
          const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
          setReviewAvg(sum / reviews.length)
          setReviewCount(reviews.length)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviewAvg(null)
          setReviewCount(0)
        }
      })
    return () => { cancelled = true }
  }, [product.id])

  const displayPrice = getDisplayPrice(product)
  const hasDiscount = isProductDiscountActive(product)
  const inStock = product.stock > 0
  const stockLabel = product.stockStatus ?? (
    product.stock === 0
      ? t('product.outOfStock')
      : product.stock <= 5
      ? t('product.onlyLeft', { count: product.stock })
      : t('product.inStock')
  )

  async function handleAddToCart() {
    if (!inStock || product.isActive === false) return
    setAdding(true)
    const available = await fetch(`/api/products/${product.id}`, { cache: 'no-store' })
      .then((res) => res.ok)
      .catch(() => false)
    if (!available) {
      setAdding(false)
      return
    }
    addToCart(product.id, qty)
    window.dispatchEvent(new Event('gather:cart-updated'))
    await new Promise((resolve) => setTimeout(resolve, 450))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleWishlist() {
    toggleWishlist(product.id)
    window.dispatchEvent(new Event('gather:wishlist-updated'))
  }

  return (
    <aside className="rounded-[28px] border border-[#ead8c4] bg-white p-5 sm:p-7 shadow-[0_18px_44px_rgba(122,98,71,0.10)]">
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#171717]">
          {resolvedLocale === 'ar' && product.nameAr ? product.nameAr : product.name}
        </h1>

        <ProductRatingSummary rating={reviewAvg} reviewCount={reviewCount} />

        <div className="border-y border-[#f1e2d3] py-5">
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-[#FE7501]">
              {formatPrice(displayPrice, product.currency)}
            </span>
            {hasDiscount && (
              <del className="text-lg font-bold text-gray-400">
                {formatPrice(product.price, product.currency)}
              </del>
            )}
          </div>
          {hasDiscount && (
            <p className="mt-1 text-sm font-bold text-[#7a6247]">{t('product.limitedOffer')}</p>
          )}
        </div>

        {product.shortDescription && (
          <p className="text-base font-semibold leading-relaxed text-[#7a6247]">
            {resolvedLocale === 'ar' && product.shortDescriptionAr ? product.shortDescriptionAr : product.shortDescription}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm font-black">
          <span className={`h-2.5 w-2.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={inStock ? 'text-green-700' : 'text-red-600'}>{stockLabel}</span>
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-sm font-black text-[#171717]">{t('product.quantity')}</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex h-[52px] w-full sm:w-36 items-center justify-between rounded-full border border-[#d8c5b2] bg-[#fffaf3] overflow-hidden">
              <button
                onClick={() => setQty((value) => Math.max(1, value - 1))}
                className="h-full w-12 text-lg font-black text-[#7a6247] hover:bg-[#fff4e8]"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="text-sm font-black">{qty}</span>
              <button
                onClick={() => setQty((value) => Math.min(Math.max(product.stock, 1), value + 1))}
                className="h-full w-12 text-lg font-black text-[#7a6247] hover:bg-[#fff4e8]"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!inStock || adding}
              aria-label={`Add ${resolvedLocale === 'ar' ? product.nameAr ?? product.name : product.name} to cart`}
              className={`h-[52px] flex-1 rounded-full px-6 text-base font-black transition-all duration-200 ${
                added
                  ? 'bg-green-500 text-white'
                  : !inStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FE7501] text-white shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5'
              }`}
            >
              {added ? t('product.added') : adding ? t('product.adding') : inStock ? t('product.addToCart') : t('product.outOfStock')}
            </button>
          </div>

          <button
            onClick={handleWishlist}
            className={`h-12 w-full rounded-full border text-sm font-black transition-colors ${
              wishlisted
                ? 'border-[#FE7501] bg-[#fff4e8] text-[#FE7501]'
                : 'border-[#d8c5b2] bg-white text-[#7a6247] hover:border-[#FE7501] hover:text-[#FE7501]'
            }`}
          >
            {wishlisted ? t('product.savedToWishlist') : t('product.addToWishlist')}
          </button>
        </div>

        {(categories.length > 0 || occasions.length > 0) && (
          <dl className="grid gap-3 border-t border-[#f1e2d3] pt-5 text-sm">
            {categories.length > 0 && (
              <MetaRow label={t('product.category')} items={categories} hrefPrefix="/shop-by-category?category=" locale={resolvedLocale} />
            )}
            {occasions.length > 0 && (
              <MetaRow label={t('product.occasion')} items={occasions} hrefPrefix="/shop-by-occasion?tag=" locale={resolvedLocale} />
            )}
          </dl>
        )}
      </div>
    </aside>
  )
}

function MetaRow({ label, items, hrefPrefix, locale }: { label: string; items: Category[]; hrefPrefix: string; locale: 'en' | 'ar' }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <dt className="font-black text-[#171717]">{label}</dt>
      <dd className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`${hrefPrefix}${item.slug}`}
            className="rounded-full bg-[#fff4e8] px-3 py-1 text-xs font-bold text-[#7a6247] hover:text-[#FE7501]"
          >
            {locale === 'ar' ? item.nameAr ?? item.name : item.name}
          </Link>
        ))}
      </dd>
    </div>
  )
}

function subscribeToWishlist(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('gather:wishlist-updated', onStoreChange)
  return () => window.removeEventListener('gather:wishlist-updated', onStoreChange)
}

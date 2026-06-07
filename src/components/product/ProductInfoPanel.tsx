'use client'

import { useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import type { Category, Product } from '@/types'
import { addToCart } from '@/lib/cart'
import { formatPrice, getDisplayPrice } from '@/lib/data'
import { isInWishlist, toggleWishlist } from '@/lib/wishlist'
import ProductRatingSummary from './ProductRatingSummary'

interface Props {
  product: Product
  categories: Category[]
  occasions: Category[]
}

export default function ProductInfoPanel({ product, categories, occasions }: Props) {
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const wishlisted = useSyncExternalStore(
    subscribeToWishlist,
    () => isInWishlist(product.id),
    () => false
  )

  const displayPrice = getDisplayPrice(product)
  const hasDiscount = product.salePrice !== null
  const inStock = product.stock > 0
  const stockLabel = product.stockStatus ?? (
    product.stock === 0
      ? 'Out of stock'
      : product.stock <= 5
      ? `Only ${product.stock} left in stock`
      : 'In stock'
  )

  async function handleAddToCart() {
    if (!inStock) return
    setAdding(true)
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
          {product.name}
        </h1>

        <ProductRatingSummary rating={product.rating} reviewCount={product.reviewCount} />

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
            <p className="mt-1 text-sm font-bold text-[#7a6247]">Limited-time Gather offer</p>
          )}
        </div>

        {product.shortDescription && (
          <p className="text-base font-semibold leading-relaxed text-[#7a6247]">
            {product.shortDescription}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm font-black">
          <span className={`h-2.5 w-2.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className={inStock ? 'text-green-700' : 'text-red-600'}>{stockLabel}</span>
        </div>

        <div className="rounded-2xl bg-[#fff7df] border border-[#f1d38a] border-l-4 border-l-[#d99a00] px-4 py-3 text-sm font-semibold text-[#6b4b00]">
          Same-day delivery available for orders placed before 2:00 PM.
        </div>

        <div className="space-y-3 pt-2">
          <label className="block text-sm font-black text-[#171717]">Quantity</label>
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
              className={`h-[52px] flex-1 rounded-full px-6 text-base font-black transition-all duration-200 ${
                added
                  ? 'bg-green-500 text-white'
                  : !inStock
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#FE7501] text-white shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5'
              }`}
            >
              {added ? 'Added to Cart' : adding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
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
            {wishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
          </button>
        </div>

        {(categories.length > 0 || occasions.length > 0) && (
          <dl className="grid gap-3 border-t border-[#f1e2d3] pt-5 text-sm">
            {categories.length > 0 && (
              <MetaRow label="Category" items={categories} hrefPrefix="/shop-by-category?category=" />
            )}
            {occasions.length > 0 && (
              <MetaRow label="Occasion" items={occasions} hrefPrefix="/shop-by-occasion?tag=" />
            )}
          </dl>
        )}
      </div>
    </aside>
  )
}

function MetaRow({ label, items, hrefPrefix }: { label: string; items: Category[]; hrefPrefix: string }) {
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
            {item.name}
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

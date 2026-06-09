'use client'

import Link from 'next/link'
import { useState, useSyncExternalStore } from 'react'
import type { Product } from '@/types'
import { formatPrice, getDisplayPrice } from '@/lib/data'
import { addToCart } from '@/lib/cart'
import { isInWishlist, toggleWishlist } from '@/lib/wishlist'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const wishlisted = useSyncExternalStore(
    subscribeToWishlist,
    () => isInWishlist(product.id),
    () => false
  )

  const displayPrice = getDisplayPrice(product)
  const hasDiscount = product.salePrice !== null

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    addToCart(product.id)
    window.dispatchEvent(new Event('gather:cart-updated'))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleToggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
    window.dispatchEvent(new Event('gather:wishlist-updated'))
  }

  return (
    <article className="group block relative pt-[72px]">
      <Link
        href={`/products/${product.slug}`}
        className="absolute left-0 right-0 top-0 h-[165px] z-10 flex items-center justify-center"
        aria-label={product.name}
      >
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>
        )}
      </Link>

      <div className="w-full min-h-[276px] rounded-2xl bg-[#fdf6ee] px-4 pb-4 pt-[101px] shadow-[2px_4px_0_rgba(0,0,0,0.8)] flex flex-col gap-2">
        <div className="h-5">
          {hasDiscount ? (
            <span className="inline-block text-[10px] font-black text-white bg-[#DB7100] px-2 py-0.5 rounded-md uppercase tracking-wider">SALE</span>
          ) : null}
        </div>

        <h3 className="text-lg sm:text-xl font-medium text-[#171717] leading-tight line-clamp-2">
          <Link href={`/products/${product.slug}`} className="hover:text-[#DB7100]">
            {product.name}
          </Link>
        </h3>

        <div className="flex items-baseline gap-2 text-base font-semibold">
          {hasDiscount && (
            <del className="text-gray-400">{formatPrice(product.price, product.currency)}</del>
          )}
          <span className="text-[#DB7100]">{formatPrice(displayPrice, product.currency)}</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold border-0 border-b-2 border-r-2 transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white border-green-700'
                : product.stock === 0
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-[#ff7a1a] text-white border-[#cc6200] hover:bg-white hover:text-[#cc6200]'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? '✓ Added' : adding ? '...' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>

          <button
            onClick={handleToggleWishlist}
            className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border-2 border-[#DB7100] transition-all duration-200 hover:bg-[#DB7100] group/btn"
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className={`w-5 h-5 transition-colors duration-200 ${
                wishlisted
                  ? 'fill-[#DB7100] stroke-[#DB7100] group-hover/btn:fill-white group-hover/btn:stroke-white'
                  : 'fill-none stroke-[#DB7100] group-hover/btn:fill-white group-hover/btn:stroke-white'
              }`}
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}

function subscribeToWishlist(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('gather:wishlist-updated', onStoreChange)
  return () => window.removeEventListener('gather:wishlist-updated', onStoreChange)
}

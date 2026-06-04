'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Product } from '@/types'
import { formatPrice, getDisplayPrice } from '@/lib/data'
import { addToCart } from '@/lib/cart'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const displayPrice = getDisplayPrice(product)
  const hasDiscount = product.salePrice !== null

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setAdding(true)
    addToCart(product.id)
    window.dispatchEvent(new Event('gather:cart-updated'))
    await new Promise((r) => setTimeout(r, 400))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <article className="flex flex-col items-center">
        <div className="w-[192px] h-[192px] flex items-center justify-center -mb-12 relative z-10">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>
          )}
        </div>

        <div className="w-full rounded-2xl bg-white p-4 shadow-[2px_4px_0_rgba(0,0,0,0.8)] flex flex-col gap-3">
          {hasDiscount && (
            <span className="text-xs font-black text-[#DB7100] uppercase tracking-wider">SALE</span>
          )}

          <h3 className="text-2xl font-medium text-[#171717] leading-tight line-clamp-2">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-[#DB7100]">
              {formatPrice(displayPrice, product.currency)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className={`w-full rounded-2xl px-6 py-3 text-sm font-bold border-0 border-b-2 border-r-2 transition-all duration-200 ${
              added
                ? 'bg-green-500 text-white border-green-700'
                : product.stock === 0
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                : 'bg-[#ff7a1a] text-white border-[#cc6200] hover:text-[#cc6200] hover:bg-white hover:border-[#cc6200]'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? '✓ Added' : adding ? '...' : product.stock === 0 ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </article>
    </Link>
  )
}

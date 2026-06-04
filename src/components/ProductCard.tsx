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
    <Link href={`/products/${product.slug}`} className="group block relative pt-[88px]">
      <div className="absolute left-0 right-0 top-0 h-[192px] z-10 flex items-center justify-center">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🎁</div>
        )}
      </div>

      <article className="w-full min-h-[250px] rounded-2xl bg-[#fdf6ee] p-4 shadow-[2px_4px_0_rgba(0,0,0,0.8)] flex flex-col gap-3 justify-between">
        {hasDiscount && (
          <span className="text-xs font-black text-[#DB7100] uppercase tracking-wider">SALE</span>
        )}

        <h3 className="text-2xl font-medium text-[#171717] leading-tight line-clamp-2">
          <span>{product.name}</span>
        </h3>

        <div className="flex items-baseline gap-2 text-base font-semibold">
          {hasDiscount && (
            <del className="text-gray-400">{formatPrice(product.price, product.currency)}</del>
          )}
          <span className="text-[#DB7100]">{formatPrice(displayPrice, product.currency)}</span>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={adding || product.stock === 0}
          className={`self-start rounded-2xl px-6 py-3 text-sm font-bold border-0 border-b-2 border-r-2 transition-all duration-200 ${
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
      </article>
    </Link>
  )
}

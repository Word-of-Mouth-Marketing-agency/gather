'use client'

import Link from 'next/link'
import Image from 'next/image'
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
      <article className="gather-card overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square bg-[#f8f8f8] overflow-hidden">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">🎁</div>
          )}

          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-[#ff7a1a] text-white text-xs font-black px-2.5 py-1 rounded-full">
              SALE
            </span>
          )}

          {product.stock <= 3 && product.stock > 0 && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-bold text-sm leading-snug text-[#171717] line-clamp-2 group-hover:text-[#ff7a1a] transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed flex-1">
            {product.shortDescription}
          </p>

          <div className="flex items-center justify-between gap-2 mt-auto pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-base text-[#ff7a1a]">
                {formatPrice(displayPrice, product.currency)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price, product.currency)}
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className={`shrink-0 h-8 px-3 rounded-full text-xs font-black transition-all duration-200 ${
                added
                  ? 'bg-green-500 text-white'
                  : product.stock === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#ff7a1a] text-white hover:bg-[#fe6c00] hover:-translate-y-0.5'
              }`}
              aria-label={`Add ${product.name} to cart`}
            >
              {added ? '✓' : adding ? '...' : product.stock === 0 ? 'Out of stock' : '+ Cart'}
            </button>
          </div>
        </div>
      </article>
    </Link>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Bundle } from '@/types'
import { getBundleProducts, formatPrice } from '@/lib/data'
import { addBundleToCart } from '@/lib/cart'

interface Props {
  bundle: Bundle
}

export default function BundleCard({ bundle }: Props) {
  const [added, setAdded] = useState(false)
  const products = getBundleProducts(bundle)

  async function handleBuy() {
    addBundleToCart(bundle)
    window.dispatchEvent(new Event('gather:cart-updated'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <article className="bg-white rounded-3xl border border-[#f1e2d3] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-5 sm:p-6 lg:p-8">
          <span className="inline-block text-xs font-black uppercase tracking-wider text-[#ff7a1a] bg-[#fff4e8] px-3 py-1 rounded-full mb-3">
            {bundle.badge}
          </span>

          <h3 className="text-xl sm:text-2xl font-bold text-[#171717]">{bundle.name}</h3>
          <p className="mt-1 text-sm text-[#7a6247]">{bundle.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
            {products.map((product, i) => (
              <span key={product.id} className="contents">
                {i > 0 && (
                  <span className="text-lg font-bold text-[#ff7a1a] select-none">+</span>
                )}
                <Link
                  href={`/products/${product.slug}`}
                  className="flex items-center gap-2 bg-[#f8f6f4] rounded-full pr-3 pl-1 py-1 text-xs font-medium text-[#333] hover:bg-[#f1e2d3] transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-base shrink-0 overflow-hidden">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>🎁</span>
                    )}
                  </span>
                  <span className="truncate max-w-[120px] sm:max-w-[160px]">{product.name}</span>
                </Link>
              </span>
            ))}
          </div>
        </div>

        <div className="lg:w-64 bg-[#FDF6EE] p-5 sm:p-6 lg:p-8 flex flex-col justify-center gap-4 border-t lg:border-t-0 lg:border-l border-[#f1e2d3]">
          <div>
            <p className="text-xs font-semibold text-[#7a6247] uppercase tracking-wide mb-2">
              Total products price
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#7a6247]">Before</span>
              <del className="text-gray-400">{formatPrice(bundle.regularPrice ?? 0, bundle.currency)}</del>
            </div>
            <div className="flex items-center justify-between text-base mt-1">
              <span className="font-semibold text-[#171717]">Offer price</span>
              <strong className="text-lg font-black text-[#ff7a1a]">
                {formatPrice(bundle.offerPrice, bundle.currency)}
              </strong>
            </div>
          </div>

          <button
            onClick={handleBuy}
            className={`w-full rounded-full font-bold text-sm py-3 px-6 transition-all duration-200 shadow-md ${
              added
                ? 'bg-green-500 text-white'
                : 'bg-[#ff7a1a] text-white hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0'
            }`}
          >
            {added ? '✓ Added to Cart' : bundle.buttonText || 'Buy Offer'}
          </button>
        </div>
      </div>
    </article>
  )
}

'use client'

import { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { getWishlist, removeFromWishlist } from '@/lib/wishlist'
import { getAllProducts } from '@/lib/data'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const ids = getWishlist()
    const all = getAllProducts()
    startTransition(() => setProducts(all.filter((p) => ids.includes(p.id))))
    const handler = () => {
      const newIds = getWishlist()
      startTransition(() => setProducts(all.filter((p) => newIds.includes(p.id))))
    }
    window.addEventListener('gather:wishlist-updated', handler)
    return () => window.removeEventListener('gather:wishlist-updated', handler)
  }, [])

  const refresh = () => {
    const ids = getWishlist()
    const all = getAllProducts()
    setProducts(all.filter((p) => ids.includes(p.id)))
    window.dispatchEvent(new Event('gather:wishlist-updated'))
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-2">My Wishlist</h1>
      <p className="text-[#7a6247] mb-8">{products.length} item{products.length !== 1 ? 's' : ''} saved</p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Your wishlist is empty</p>
          <Link href="/shop-by-category" className="gather-btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard product={product} />
              <button
                onClick={() => { removeFromWishlist(product.id); refresh() }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors z-10"
                aria-label="Remove from wishlist"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

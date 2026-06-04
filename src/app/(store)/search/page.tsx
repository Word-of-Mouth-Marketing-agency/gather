'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { getAllProducts } from '@/lib/data'
import ProductCard from '@/components/ProductCard'

function SearchResults() {
  const params = useSearchParams()
  const q = params.get('q') || ''
  const query = q.trim().toLowerCase()

  const products = getAllProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query)
  )

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-2">
        Search results for &ldquo;{q}&rdquo;
      </h1>
      <p className="text-[#7a6247] mb-8">
        {products.length} product{products.length !== 1 ? 's' : ''} found
      </p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">No products match your search.</p>
          <Link href="/shop-by-category" className="gather-btn-primary">
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-gray-400">Loading...</p>
      </main>
    }>
      <SearchResults />
    </Suspense>
  )
}

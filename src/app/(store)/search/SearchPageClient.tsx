'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllProducts, getAllCategories } from '@/lib/data'
import ProductCard from '@/components/ProductCard'
import type { Product } from '@/types'
import { useLocale } from '@/components/LocaleProvider'

function SearchResults() {
  const { t } = useLocale()
  const params = useSearchParams()
  const q = params.get('q') || ''
  const query = q.trim().toLowerCase()

  const [allProducts, setAllProducts] = useState<Product[]>(() => getAllProducts())
  const [allCategories, setAllCategories] = useState(() => getAllCategories())

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => setAllProducts(data))
      .catch(() => {})
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setAllCategories(data))
      .catch(() => {})
  }, [])

  if (!query) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-2">
          {t('search.title')}
        </h1>
        <p className="text-[#7a6247] mb-8">{t('search.placeholder')}</p>
        <div className="text-center py-20">
          <Link href="/shop-by-category" className="gather-btn-primary">
            {t('search.browse')}
          </Link>
        </div>
      </main>
    )
  }

  const titleMatches: Product[] = []
  const descriptionMatches: Product[] = []

  for (const p of allProducts) {
    const name = (p.name ?? '').toLowerCase()
    const shortDesc = (p.shortDescription ?? '').toLowerCase()
    const desc = (p.description ?? '').toLowerCase()

    const productCatNames = p.categoryIds
      .map((id) => allCategories.find((c) => c.id === id)?.name)
      .filter(Boolean)
    const productOccasionNames = p.occasionIds
      .map((id) => allCategories.find((c) => c.id === id)?.name)
      .filter(Boolean)

    const catText = productCatNames.join(' ').toLowerCase()
    const occText = productOccasionNames.join(' ').toLowerCase()

    if (name.includes(query)) {
      titleMatches.push(p)
      continue
    }

    if (
      shortDesc.includes(query) ||
      desc.includes(query) ||
      catText.includes(query) ||
      occText.includes(query)
    ) {
      descriptionMatches.push(p)
    }
  }

  const products = [...titleMatches, ...descriptionMatches]

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-black text-[#171717] mb-2">
        {t('search.resultsFor')} &ldquo;{q}&rdquo;
      </h1>
      <p className="text-[#7a6247] mb-8">
        {products.length} {products.length === 1 ? t('search.found') : t('search.found')}
      </p>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">{t('search.noMatch')}</p>
          <Link href="/shop-by-category" className="gather-btn-primary">
            {t('search.browse')}
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
  const { t } = useLocale()
  return (
    <Suspense fallback={
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-gray-400">{t('search.loading')}</p>
      </main>
    }>
      <SearchResults />
    </Suspense>
  )
}

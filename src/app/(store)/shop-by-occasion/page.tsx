import type { Metadata } from 'next'
import { getAllProducts, getCategoriesByType, getProductsByOccasion } from '@/lib/data'

export const dynamic = 'force-dynamic'
import PageTitleSection from '@/components/PageTitleSection'
import ProductCard from '@/components/ProductCard'
import TaxonomyFilterBar from '@/components/TaxonomyFilterBar'

export const metadata: Metadata = {
  title: 'Shop by Occasion',
  description: 'Find the perfect gift for birthdays, engagements, Eid, Ramadan, Mother\'s Day, and more.',
}

interface Props {
  searchParams: Promise<{ tag?: string }>
}

export default async function ShopByOccasionPage({ searchParams }: Props) {
  const { tag } = await searchParams
  const occasions = getCategoriesByType('occasion')
  const activeOccasion = tag
    ? occasions.find((occasion) => occasion.slug === tag)
    : undefined
  const products = activeOccasion
    ? getProductsByOccasion(activeOccasion.id)
    : getAllProducts()

  return (
    <>
      <PageTitleSection title="Shop by Occasion" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TaxonomyFilterBar
          baseHref="/shop-by-occasion"
          queryKey="tag"
          items={occasions}
          activeSlug={activeOccasion?.slug}
        />

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No products for this occasion yet.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}

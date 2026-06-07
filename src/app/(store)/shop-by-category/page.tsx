import type { Metadata } from 'next'
import { getAllProducts, getCategoriesByType, getProductsByCategory } from '@/lib/data'

export const dynamic = 'force-dynamic'
import PageTitleSection from '@/components/PageTitleSection'
import ProductCard from '@/components/ProductCard'
import TaxonomyFilterBar from '@/components/TaxonomyFilterBar'

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Browse all gift categories at Gather — gift boxes, flowers, chocolates, candles, balloons, and more.',
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function ShopByCategoryPage({ searchParams }: Props) {
  const { category: categorySlug } = await searchParams
  const categories = getCategoriesByType('category')
  const activeCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined
  const products = activeCategory
    ? getProductsByCategory(activeCategory.id)
    : getAllProducts()

  return (
    <>
      <PageTitleSection title="Shop by Category" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TaxonomyFilterBar
          baseHref="/shop-by-category"
          queryKey="category"
          items={categories}
          activeSlug={activeCategory?.slug}
        />

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No products in this category yet.</div>
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

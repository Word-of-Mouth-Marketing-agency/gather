import type { Metadata } from 'next'
import { getAllProducts, getProductsByCategory } from '@/lib/data'
import { getActiveTaxonomiesByType } from '@/lib/taxonomy-data'
import { sortProductsForTaxonomy } from '@/lib/filter-product-sorting'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'

export const dynamic = 'force-dynamic'
import PageTitleSection from '@/components/PageTitleSection'
import ProductCard from '@/components/ProductCard'
import TaxonomyFilterBar from '@/components/TaxonomyFilterBar'
import GsapReveal from '@/components/GsapReveal'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  return {
    title: t('meta.shopByCategory', locale),
    description: 'Browse all gift categories at Gather — gift boxes, flowers, chocolates, candles, balloons, and more.',
  }
}

interface Props {
  searchParams: Promise<{ category?: string }>
}

export default async function ShopByCategoryPage({ searchParams }: Props) {
  const locale = await getServerLocale()
  const { category: categorySlug } = await searchParams
  const categories = getActiveTaxonomiesByType('category')
  const activeCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : undefined
  const products = activeCategory
    ? sortProductsForTaxonomy(getProductsByCategory(activeCategory.id), activeCategory)
    : getAllProducts()

  return (
    <>
      <PageTitleSection title="Shop by Category" accentWord="Category" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TaxonomyFilterBar
          baseHref="/shop-by-category"
          queryKey="category"
          items={categories}
          activeSlug={activeCategory?.slug}
          locale={locale}
        />

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{t('empty.noProductsCategory', locale)}</div>
        ) : (
          <GsapReveal
            className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
            itemSelector="[data-reveal-item]"
          >
            {products.map((product) => (
              <div key={product.id} data-reveal-item>
                <ProductCard product={product} />
              </div>
            ))}
          </GsapReveal>
        )}
      </main>
    </>
  )
}

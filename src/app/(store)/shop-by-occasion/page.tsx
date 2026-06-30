import type { Metadata } from 'next'
import { getAllProducts, getProductsByOccasion } from '@/lib/data'
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
    title: t('meta.shopByOccasion', locale),
    description: 'Find the perfect gift for birthdays, engagements, Eid, Ramadan, Mother\'s Day, and more.',
  }
}

interface Props {
  searchParams: Promise<{ tag?: string }>
}

export default async function ShopByOccasionPage({ searchParams }: Props) {
  const locale = await getServerLocale()
  const { tag } = await searchParams
  const occasions = getActiveTaxonomiesByType('occasion')
  const activeOccasion = tag
    ? occasions.find((occasion) => occasion.slug === tag)
    : undefined
  const products = activeOccasion
    ? sortProductsForTaxonomy(getProductsByOccasion(activeOccasion.id), activeOccasion)
    : getAllProducts()

  return (
    <>
      <PageTitleSection title={t('meta.shopByOccasion', locale)} accentWord={locale === 'ar' ? 'المناسبة' : 'Occasion'} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <TaxonomyFilterBar
          baseHref="/shop-by-occasion"
          queryKey="tag"
          items={occasions}
          activeSlug={activeOccasion?.slug}
          locale={locale}
        />

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{t('empty.noProductsOccasion', locale)}</div>
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

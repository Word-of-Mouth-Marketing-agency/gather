import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductsByOccasion } from '@/lib/data'
import { getActiveTaxonomiesByType, getTaxonomyBySlug } from '@/lib/taxonomy-data'
import { sortProductsForTaxonomy } from '@/lib/filter-product-sorting'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'

export const dynamic = 'force-dynamic'
import ProductCard from '@/components/ProductCard'
import PageTitleSection from '@/components/PageTitleSection'
import GsapReveal from '@/components/GsapReveal'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const occasions = getActiveTaxonomiesByType('occasion')
  return occasions.map((o) => ({ slug: o.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const occasion = getTaxonomyBySlug(slug)
  if (!occasion) return {}
  const name = occasion.nameAr ?? occasion.name
  return {
    title: name,
    description: occasion.description,
  }
}

export default async function OccasionDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getServerLocale()
  const occasion = getTaxonomyBySlug(slug)
  const occasionName = locale === 'ar' ? occasion?.nameAr ?? occasion?.name ?? '' : occasion?.name ?? ''

  if (!occasion || occasion.type !== 'occasion' || occasion.isActive === false) notFound()

  const products = sortProductsForTaxonomy(getProductsByOccasion(occasion.id), occasion)

  return (
    <>
      <PageTitleSection title={occasionName} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

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

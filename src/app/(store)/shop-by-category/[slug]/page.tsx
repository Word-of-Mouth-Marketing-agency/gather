import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductsByCategory } from '@/lib/data'
import { getActiveTaxonomiesByType, getTaxonomyBySlug } from '@/lib/taxonomy-data'
import { sortProductsForTaxonomy } from '@/lib/filter-product-sorting'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'
import ProductCard from '@/components/ProductCard'
import PageTitleSection from '@/components/PageTitleSection'
import GsapReveal from '@/components/GsapReveal'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = getActiveTaxonomiesByType('category')
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = getTaxonomyBySlug(slug)
  if (!category) return {}
  const name = category.nameAr ?? category.name
  return {
    title: name,
    description: category.description,
  }
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params
  const locale = await getServerLocale()
  const category = getTaxonomyBySlug(slug)
  const categoryName = locale === 'ar' ? category?.nameAr ?? category?.name ?? '' : category?.name ?? ''

  if (!category || category.type !== 'category' || category.isActive === false) notFound()

  const products = sortProductsForTaxonomy(getProductsByCategory(category.id), category)

  return (
    <>
      <PageTitleSection title={categoryName} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

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

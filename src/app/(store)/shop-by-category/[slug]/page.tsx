import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductsByCategory } from '@/lib/data'
import { getActiveTaxonomiesByType, getTaxonomyBySlug } from '@/lib/taxonomy-data'
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
  return {
    title: category.name,
    description: category.description,
  }
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params
  const category = getTaxonomyBySlug(slug)

  if (!category || category.type !== 'category' || category.isActive === false) notFound()

  const products = getProductsByCategory(category.id)

  return (
    <>
      <PageTitleSection title={category.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No products in this category yet.</div>
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

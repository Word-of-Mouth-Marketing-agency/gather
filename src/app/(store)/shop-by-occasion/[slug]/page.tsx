import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getCategoriesByType, getProductsByOccasion } from '@/lib/data'

export const dynamic = 'force-dynamic'
import ProductCard from '@/components/ProductCard'
import PageTitleSection from '@/components/PageTitleSection'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const occasions = getCategoriesByType('occasion')
  return occasions.map((o) => ({ slug: o.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const occasion = getCategoryBySlug(slug)
  if (!occasion) return {}
  return {
    title: occasion.name,
    description: occasion.description,
  }
}

export default async function OccasionDetailPage({ params }: Props) {
  const { slug } = await params
  const occasion = getCategoryBySlug(slug)

  if (!occasion || occasion.type !== 'occasion' || occasion.isActive === false) notFound()

  const products = getProductsByOccasion(occasion.id)

  return (
    <>
      <PageTitleSection title={occasion.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

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

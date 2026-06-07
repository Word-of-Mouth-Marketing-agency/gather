import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getCategoryBySlug, getCategoriesByType, getProductsByCategory } from '@/lib/data'
import ProductCard from '@/components/ProductCard'
import PageTitleSection from '@/components/PageTitleSection'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const categories = getCategoriesByType('category')
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: category.name,
    description: category.description,
  }
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category || category.type !== 'category' || category.isActive === false) notFound()

  const products = getProductsByCategory(category.id)

  return (
    <>
      <PageTitleSection title={category.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

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

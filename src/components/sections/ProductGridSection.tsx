import Link from 'next/link'
import type { ProductGridSectionProps } from '@/types'
import {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductsByOccasion,
} from '@/lib/data'
import ProductCard from '@/components/ProductCard'

export default function ProductGridSection({
  title,
  subtitle,
  categoryId,
  occasionId,
  productIds,
  limit = 8,
  showViewAll,
  viewAllUrl,
}: ProductGridSectionProps) {
  let products = productIds
    ? getAllProducts().filter((p) => productIds.includes(p.id))
    : categoryId
    ? getProductsByCategory(categoryId)
    : occasionId
    ? getProductsByOccasion(occasionId)
    : getFeaturedProducts()

  products = products.slice(0, limit)

  if (products.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[#7a6247]">{subtitle}</p>}
        </div>
        {showViewAll && viewAllUrl && (
          <Link
            href={viewAllUrl}
            className="shrink-0 text-sm font-bold text-[#ff7a1a] hover:underline"
          >
            View all →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}

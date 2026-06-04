import type { ProductGridSectionProps } from '@/types'
import {
  getAllProducts,
  getFeaturedProducts,
  getProductsByCategory,
  getProductsByOccasion,
} from '@/lib/data'
import ProductCard from '@/components/ProductCard'
import ProductSlider from './ProductSlider'

export default function ProductGridSection({
  title,
  subtitle,
  categoryId,
  occasionId,
  productIds,
  limit = 8,
  showViewAll,
  viewAllUrl,
  slider,
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
    <section className="w-full py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-[#7a6247]">{subtitle}</p>}
        </div>

        {slider ? (
          <ProductSlider products={products} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 sm:gap-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

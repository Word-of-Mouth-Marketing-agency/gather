import type { CategoryGridSectionProps } from '@/types'
import { getCategoriesByType } from '@/lib/data'
import CategoryCard from '@/components/CategoryCard'

export default function CategoryGridSection({ title, subtitle, type, limit }: CategoryGridSectionProps) {
  const categories = getCategoriesByType(type, limit)

  if (categories.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#7a6247]">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}

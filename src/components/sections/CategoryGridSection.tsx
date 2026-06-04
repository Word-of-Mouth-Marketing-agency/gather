import type { CategoryGridSectionProps } from '@/types'
import { getCategoriesByType } from '@/lib/data'
import CategoryCard from '@/components/CategoryCard'

export default function CategoryGridSection({ title, subtitle, type, limit }: CategoryGridSectionProps) {
  const categories = getCategoriesByType(type, limit)

  if (categories.length === 0) return null

  return (
    <section className="w-full py-12 lg:py-16" style={{ backgroundColor: '#FCECDC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 lg:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717]">{title}</h2>
          {subtitle && <p className="mt-2 text-sm sm:text-base text-[#7a6247]">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 lg:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  )
}

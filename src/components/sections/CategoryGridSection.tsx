import type { CategoryGridSectionProps } from '@/types'
import { getActiveTaxonomiesByType } from '@/lib/taxonomy-data'
import CategoryCard from '@/components/CategoryCard'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'

interface Props extends CategoryGridSectionProps {
  locale?: string
}

export default function CategoryGridSection({ title, subtitle, type, limit, locale }: Props) {
  const categories = getActiveTaxonomiesByType(type, limit)

  if (categories.length === 0) return null

  return (
    <section className="w-full py-12 lg:py-16" style={{ backgroundColor: '#FCECDC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 lg:mb-10 text-center">
          <AnimatedTitle
            as="h2"
            text={title}
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717]"
          />
          {subtitle && <p className="mt-2 text-sm sm:text-base text-[#7a6247]">{subtitle}</p>}
        </div>

        <GsapReveal
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 lg:gap-6"
          itemSelector="[data-reveal-item]"
        >
          {categories.map((category) => (
            <div key={category.id} data-reveal-item>
              <CategoryCard category={category} locale={locale} />
            </div>
          ))}
        </GsapReveal>
      </div>
    </section>
  )
}

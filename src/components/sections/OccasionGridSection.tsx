'use client'

import Link from 'next/link'
import { useEffect, useState, startTransition } from 'react'
import type { Category } from '@/types'
import type { OccasionSectionProps } from '@/types'
import { getCategoriesByType } from '@/lib/data'
import { useLocale } from '@/components/LocaleProvider'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'

export default function OccasionGridSection({
  title,
  subtitle,
}: OccasionSectionProps) {
  const { locale } = useLocale()
  const [occasions, setOccasions] = useState<Category[]>(() => getCategoriesByType('occasion'))

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return
        const activeOccasions = (data as Category[])
          .filter((item) => item.type === 'occasion')
          .filter((item) => item.isActive !== false)
          .sort((a, b) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0))
        startTransition(() => setOccasions(activeOccasions))
      })
      .catch(() => {})
  }, [])

  if (occasions.length === 0) return null

  return (
    <section id="shop-by-occasion" className="relative w-full py-12 lg:py-16 overflow-hidden bg-[#FDF6EE] scroll-mt-20 lg:scroll-mt-24">
      <div className="absolute -bottom-8 -right-8 w-64 h-64 sm:w-80 sm:h-80 opacity-40 pointer-events-none select-none">
        <img
          src="/assets/gather/occasions/decoration.svg"
          alt=""
          className="w-full h-full object-contain animate-float"
          aria-hidden
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 lg:mb-10 text-center">
          <AnimatedTitle
            as="h2"
            text={title}
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717]"
          />
          {subtitle && <p className="mt-2 text-sm sm:text-base text-[#7a6247]">{subtitle}</p>}
        </div>

        <GsapReveal
          className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
          itemSelector="[data-reveal-item]"
        >
          {occasions.map((occasion) => {
            const image = occasion.image || '/assets/gather/occasions/birthday.jpg'
            const occasionName = locale === 'ar' ? occasion.nameAr ?? occasion.name : occasion.name
            return (
              <Link
                key={occasion.id}
                data-reveal-item
                href={`/shop-by-occasion?tag=${occasion.slug}`}
                className="group relative aspect-[3/2] rounded-2xl overflow-hidden bg-gray-200"
              >
                <img
                  src={image}
                  alt={occasionName}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40" />
                <span className="absolute inset-0 flex items-center justify-center text-white text-lg sm:text-xl font-bold text-center leading-tight px-3">
                  {occasionName}
                </span>
              </Link>
            )
          })}
        </GsapReveal>
      </div>
    </section>
  )
}

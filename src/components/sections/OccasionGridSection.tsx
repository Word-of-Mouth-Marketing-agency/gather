'use client'

import Link from 'next/link'
import type { OccasionSectionProps } from '@/types'
import { getCategoriesByType } from '@/lib/data'
import { useScrollParallax } from '@/lib/useScrollParallax'

export default function OccasionGridSection({
  title,
  subtitle,
}: OccasionSectionProps) {
  const occasions = getCategoriesByType('occasion')
  const { ref: sectionRef, translateY } = useScrollParallax({ maxTranslate: -400 })

  if (occasions.length === 0) return null

  return (
    <section className="relative w-full py-12 lg:py-16 overflow-hidden bg-[#FDF6EE]" ref={sectionRef}>
      <div className="absolute -bottom-8 -right-8 w-64 h-64 sm:w-80 sm:h-80 opacity-40 pointer-events-none select-none">
        <img
          src="/assets/gather/occasions/decoration.svg"
          alt=""
          className="w-full h-full object-contain animate-float"
          aria-hidden
        />
      </div>

      <div
        className="absolute -bottom-2 sm:bottom-4 right-0 w-36 h-36 sm:w-48 sm:h-48 pointer-events-none select-none z-10"
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <img
          src="/assets/gather/floating-rabbit.webp"
          alt=""
          className="w-full h-full object-contain"
          aria-hidden
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 lg:mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717]">{title}</h2>
          {subtitle && <p className="mt-2 text-sm sm:text-base text-[#7a6247]">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {occasions.map((occasion) => (
            <Link
              key={occasion.id}
              href={`/shop-by-occasion?tag=${occasion.slug}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-200"
            >
              <img
                src={occasion.image}
                alt={occasion.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40" />
              <span className="absolute inset-0 flex items-center justify-center text-white text-lg sm:text-xl font-bold text-center leading-tight px-3">
                {occasion.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

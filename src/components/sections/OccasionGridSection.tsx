'use client'

import Link from 'next/link'
import type { OccasionSectionProps } from '@/types'
import { getCategoriesByType } from '@/lib/data'

const occasionColors: Record<string, string> = {
  birthday: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
  'friends-gathering': 'bg-sky-100 text-sky-700 hover:bg-sky-200',
  'family-gathering': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
  engagement: 'bg-rose-100 text-rose-700 hover:bg-rose-200',
  'professional-meetings': 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  'christmas-eoy': 'bg-red-100 text-red-700 hover:bg-red-200',
  ramadan: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  'mothers-day': 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200',
  'eid-fitr': 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  easter: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  adha: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  halloween: 'bg-stone-100 text-stone-700 hover:bg-stone-200',
}

export default function OccasionGridSection({
  title,
  subtitle,
}: OccasionSectionProps) {
  const occasions = getCategoriesByType('occasion')

  if (occasions.length === 0) return null

  return (
    <section className="relative w-full py-12 lg:py-16 overflow-hidden bg-[#FDF6EE]">
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
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#171717]">{title}</h2>
          {subtitle && <p className="mt-2 text-sm sm:text-base text-[#7a6247]">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {occasions.map((occasion) => (
            <Link
              key={occasion.id}
              href={`/shop-by-occasion?tag=${occasion.slug}`}
              className={`flex flex-col items-center justify-center rounded-2xl px-3 py-5 sm:py-6 text-center font-bold text-sm sm:text-base transition-all duration-200 ${
                occasionColors[occasion.slug] ?? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="leading-tight">{occasion.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

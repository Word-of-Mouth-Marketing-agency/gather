import type { Metadata } from 'next'
import { getCategoriesByType } from '@/lib/data'

export const dynamic = 'force-dynamic'
import CategoryCard from '@/components/CategoryCard'

export const metadata: Metadata = {
  title: 'Shop by Occasion',
  description: 'Find the perfect gift for birthdays, engagements, Eid, Ramadan, Mother\'s Day, and more.',
}

export default function ShopByOccasionPage() {
  const occasions = getCategoriesByType('occasion')

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-[#171717]">Shop by Occasion</h1>
        <p className="mt-2 text-[#7a6247]">Find the perfect gift for every special moment</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {occasions.map((occ) => (
          <CategoryCard key={occ.id} category={occ} />
        ))}
      </div>
    </main>
  )
}

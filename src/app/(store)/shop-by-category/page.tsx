import type { Metadata } from 'next'
import { getCategoriesByType } from '@/lib/data'

export const dynamic = 'force-dynamic'
import CategoryCard from '@/components/CategoryCard'

export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Browse all gift categories at Gather — gift boxes, flowers, chocolates, candles, balloons, and more.',
}

export default function ShopByCategoryPage() {
  const categories = getCategoriesByType('category')

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-[#171717]">Shop by Category</h1>
        <p className="mt-2 text-[#7a6247]">Explore our full range of premium gift categories</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </main>
  )
}

import Link from 'next/link'
import type { Category } from '@/types'

interface Props {
  category: Category
  locale?: string
}

export default function CategoryCard({ category, locale }: Props) {
  const name = locale === 'ar' ? category.nameAr ?? category.name : category.name
  const image = category.image || '/assets/gather/categories/decorations.png'
  const href =
    category.type === 'occasion'
      ? `/shop-by-occasion/${category.slug}`
      : `/shop-by-category?category=${category.slug}`

  return (
    <Link href={href} className="group flex flex-col items-center gap-3">
      <div className="w-full max-w-[130px] sm:max-w-[150px] lg:max-w-[180px] aspect-square rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <img
          src={image}
          alt={name}
          className={`w-full h-full transition-all duration-300 ease-in-out group-hover:rotate-[8deg] group-hover:scale-[0.8] ${
            category.slug === 'mothers-day'
              ? 'object-contain object-top'
              : 'object-contain'
          }`}
        />
      </div>
      <span className="text-sm sm:text-base font-semibold text-[#333] text-center leading-tight">
        {name}
      </span>
    </Link>
  )
}

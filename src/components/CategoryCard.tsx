import Link from 'next/link'
import type { Category } from '@/types'

interface Props {
  category: Category
}

export default function CategoryCard({ category }: Props) {
  const href =
    category.type === 'occasion'
      ? `/shop-by-occasion/${category.slug}`
      : `/shop-by-category?category=${category.slug}`

  return (
    <Link href={href} className="group flex flex-col items-center gap-3">
      <div className="w-full max-w-[130px] aspect-square rounded-2xl flex items-center justify-center p-3 overflow-hidden">
        <img
          src={category.image}
          alt={category.name}
          className="w-full h-full object-contain transition-all duration-300 ease-in-out group-hover:rotate-[8deg] group-hover:scale-[0.8]"
        />
      </div>
      <span className="text-sm sm:text-base font-semibold text-[#333] text-center leading-tight">
        {category.name}
      </span>
    </Link>
  )
}

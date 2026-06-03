import Link from 'next/link'
import Image from 'next/image'
import type { Category } from '@/types'

interface Props {
  category: Category
}

export default function CategoryCard({ category }: Props) {
  const href =
    category.type === 'occasion'
      ? `/shop-by-occasion/${category.slug}`
      : `/shop-by-category/${category.slug}`

  return (
    <Link href={href} className="group block">
      <article className="relative aspect-square rounded-2xl overflow-hidden bg-[#f8f8f8] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[#fff4e8] flex items-center justify-center text-5xl">
            🎁
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Label */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <span className="text-white font-bold text-sm leading-tight">{category.name}</span>
        </div>
      </article>
    </Link>
  )
}

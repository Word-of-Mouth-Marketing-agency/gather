import Link from 'next/link'
import type { Category } from '@/types'

interface Props {
  baseHref: string
  queryKey: string
  items: Category[]
  activeSlug?: string
}

export default function TaxonomyFilterBar({ baseHref, queryKey, items, activeSlug }: Props) {
  return (
    <nav aria-label="Taxonomy filters" className="mb-8">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <TaxonomyFilterPill href={baseHref} active={!activeSlug}>
          All
        </TaxonomyFilterPill>
        {items.map((item) => (
          <TaxonomyFilterPill
            key={item.id}
            href={`${baseHref}?${queryKey}=${item.slug}`}
            active={activeSlug === item.slug}
          >
            {item.name}
          </TaxonomyFilterPill>
        ))}
      </div>
    </nav>
  )
}

function TaxonomyFilterPill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-[18px] py-2.5 text-sm font-bold leading-none transition-colors ${
        active
          ? 'border-[#171717] bg-[#171717] text-white'
          : 'border-[#171717] bg-[#fff4e8] text-[#171717] hover:border-[#FE7501] hover:text-[#FE7501]'
      }`}
    >
      {children}
    </Link>
  )
}

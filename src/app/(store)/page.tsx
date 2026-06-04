import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/data'
import SectionRenderer from '@/components/SectionRenderer'
import HeroSlideshow from '@/components/sections/HeroSlideshow'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Gather — Premium Gifts Delivered Same-Day in Cairo',
}

export default function HomePage() {
  const page = getPageBySlug('home')

  if (!page) {
    return (
      <main className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Page not found</p>
      </main>
    )
  }

  const sections = page.sections.filter((s) => s.type !== 'hero')

  return (
    <main className="overflow-x-hidden">
      <HeroSlideshow />
      <SectionRenderer sections={sections} />
    </main>
  )
}

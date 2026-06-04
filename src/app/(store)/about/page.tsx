import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/data'

export const dynamic = 'force-dynamic'
import SectionRenderer from '@/components/SectionRenderer'

export const metadata: Metadata = {
  title: 'About Gather',
  description: "Learn about Gather — Cairo's premium gifting platform.",
}

export default function AboutPage() {
  const page = getPageBySlug('about')
  if (!page) return <main className="py-20 text-center text-gray-400">Page not found</main>

  return (
    <main className="py-10 lg:py-14">
      <SectionRenderer sections={page.sections} />
    </main>
  )
}

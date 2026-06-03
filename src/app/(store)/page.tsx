import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/data'
import SectionRenderer from '@/components/SectionRenderer'

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

  return (
    <main className="py-8 lg:py-12 overflow-x-hidden">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-8 lg:mb-12">
        {/* Hero renders full-width inside SectionRenderer */}
      </div>
      <SectionRenderer sections={page.sections} />
    </main>
  )
}

import type { Metadata } from 'next'
import { getPageBySlug, getHomepageContent } from '@/lib/data'
import SectionRenderer from '@/components/SectionRenderer'
import HeroSlideshow from '@/components/sections/HeroSlideshow'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Gather — Premium Gifts Delivered Same-Day in Cairo',
}

export default function HomePage() {
  const page = getPageBySlug('home')
  const homepage = getHomepageContent()

  if (!page) {
    return (
      <main className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Page not found</p>
      </main>
    )
  }

  const sections = page.sections
    .filter((s) => s.type !== 'hero')
    .map((s) => {
      if (s.type === 'about-gather') {
        return {
          ...s,
          props: {
            ...s.props,
            title: homepage.aboutGather.title,
            subtitle: homepage.aboutGather.subtitle,
            body: homepage.aboutGather.body,
            ctaText: homepage.aboutGather.ctaText,
            ctaUrl: homepage.aboutGather.ctaUrl,
            leftImage: homepage.aboutGather.leftImage,
            rightImage: homepage.aboutGather.rightImage,
          },
        }
      }
      if (s.type === 'why-gather') {
        return {
          ...s,
          props: {
            ...s.props,
            cards: homepage.whyGatherCards,
          },
        }
      }
      return s
    })

  return (
    <main className="overflow-x-clip">
      <HeroSlideshow slides={homepage.heroSlides} heroText={homepage.heroText} />
      <SectionRenderer sections={sections} />
    </main>
  )
}

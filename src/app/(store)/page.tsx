import type { Metadata } from 'next'
import { getPageBySlug, getHomepageContent } from '@/lib/data'
import SectionRenderer from '@/components/SectionRenderer'
import HeroSlideshow from '@/components/sections/HeroSlideshow'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  return {
    title: t('meta.home', locale),
  }
}

export default async function HomePage() {
  const locale = await getServerLocale()
  const isAr = locale === 'ar'
  const page = getPageBySlug('home')
  const homepage = getHomepageContent()

  if (!page) {
    return (
      <main className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">{t('error.pageNotFound', locale)}</p>
      </main>
    )
  }

  const heroText = isAr ? homepage.ar?.heroText ?? homepage.heroText : homepage.heroText
  const aboutGather = isAr ? homepage.ar?.aboutGather ?? homepage.aboutGather : homepage.aboutGather
  const whyGatherCards = isAr ? homepage.ar?.whyGatherCards ?? homepage.whyGatherCards : homepage.whyGatherCards

  const sections = page.sections
    .filter((s) => s.type !== 'hero')
    .map((s) => {
      if (s.type === 'about-gather') {
        return {
          ...s,
          props: {
            ...s.props,
            title: aboutGather.title,
            subtitle: aboutGather.subtitle,
            body: aboutGather.body,
            ctaText: aboutGather.ctaText,
            ctaUrl: aboutGather.ctaUrl,
            leftImage: aboutGather.leftImage,
            rightImage: aboutGather.rightImage,
            locale,
          },
        }
      }
      if (s.type === 'why-gather') {
        return {
          ...s,
          props: {
            ...s.props,
            title: t('home.whyGather', locale),
            subtitle: undefined,
            cards: whyGatherCards,
          },
        }
      }
      if (s.type === 'category-grid') {
        return {
          ...s,
          props: {
            ...s.props,
            title: t('home.shopByCategory', locale),
            subtitle: t('home.shopByCategorySub', locale),
          },
        }
      }
      if (s.type === 'product-grid') {
        return {
          ...s,
          props: {
            ...s.props,
            title: t('home.featuredItems', locale),
            subtitle: t('home.featuredSub', locale),
          },
        }
      }
      if (s.type === 'occasions' || s.type === 'occasion-grid') {
        return {
          ...s,
          props: {
            ...s.props,
            title: t('home.shopByOccasion', locale),
            subtitle: t('home.shopByOccasionSub', locale),
          },
        }
      }
      if (s.type === 'offers-grid') {
        return {
          ...s,
          props: {
            ...s.props,
            title: t('home.offers', locale),
            subtitle: t('home.offersSub', locale),
          },
        }
      }
      if (s.type === 'moments') {
        return {
          ...s,
          props: {
            ...s.props,
            title: t('home.gatherMoments', locale),
            subtitle: t('home.gatherMomentsSub', locale),
            buttonText: t('home.shareMoment', locale),
          },
        }
      }
      return s
    })

  return (
    <main className="overflow-x-clip">
      <HeroSlideshow slides={homepage.heroSlides} heroText={heroText} isRTL={isAr} />
      <SectionRenderer sections={sections} locale={locale} />
    </main>
  )
}

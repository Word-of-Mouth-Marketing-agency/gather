import type { Section, SectionType } from '@/types'
import HeroSection from './sections/HeroSection'
import BannerSection from './sections/BannerSection'
import ProductGridSection from './sections/ProductGridSection'
import CategoryGridSection from './sections/CategoryGridSection'
import TextBlockSection from './sections/TextBlockSection'
import CtaBannerSection from './sections/CtaBannerSection'
import MomentsWallSection from './sections/MomentsWallSection'
import WhyGatherSection from './sections/WhyGatherSection'
import OccasionGridSection from './sections/OccasionGridSection'
import OffersBundlesSection from './sections/OffersBundlesSection'
import AboutGatherSection from './sections/AboutGatherSection'
import GatherMomentsSection from './sections/GatherMomentsSection'

interface Props {
  sections: Section[]
  locale?: string
}

export default function SectionRenderer({ sections, locale }: Props) {
  const visible = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col">
      {visible.map((section) => (
        <SectionSwitch key={section.id} section={section} locale={locale} />
      ))}
    </div>
  )
}

function SectionSwitch({ section, locale }: { section: Section; locale?: string }) {
  const type = section.type as SectionType

  switch (type) {
    case 'hero':
      return <HeroSection {...(section.props as React.ComponentProps<typeof HeroSection>)} />

    case 'banner':
      return <BannerSection {...(section.props as React.ComponentProps<typeof BannerSection>)} />

    case 'product-grid':
      return (
        <ProductGridSection
          {...(section.props as React.ComponentProps<typeof ProductGridSection>)}
        />
      )

    case 'category-grid':
      return (
        <CategoryGridSection
          {...(section.props as React.ComponentProps<typeof CategoryGridSection>)}
          type="category"
          locale={locale}
        />
      )

    case 'occasion-grid':
      return (
        <CategoryGridSection
          {...(section.props as React.ComponentProps<typeof CategoryGridSection>)}
          type="occasion"
          locale={locale}
        />
      )

    case 'text-block':
      return (
        <TextBlockSection
          {...(section.props as React.ComponentProps<typeof TextBlockSection>)}
        />
      )

    case 'cta-banner':
      return (
        <CtaBannerSection
          {...(section.props as React.ComponentProps<typeof CtaBannerSection>)}
        />
      )

    case 'moments-wall':
      return (
        <MomentsWallSection
          {...(section.props as React.ComponentProps<typeof MomentsWallSection>)}
        />
      )

    case 'offers-grid':
      return (
        <OffersBundlesSection
          {...(section.props as React.ComponentProps<typeof OffersBundlesSection>)}
        />
      )

    case 'why-gather':
      return (
        <WhyGatherSection
          {...(section.props as React.ComponentProps<typeof WhyGatherSection>)}
        />
      )

    case 'about-gather':
      return (
        <AboutGatherSection
          {...(section.props as React.ComponentProps<typeof AboutGatherSection>)}
          locale={locale}
        />
      )

    case 'moments':
      return (
        <GatherMomentsSection
          {...(section.props as React.ComponentProps<typeof GatherMomentsSection>)}
        />
      )

    case 'occasions':
      return (
        <OccasionGridSection
          {...(section.props as React.ComponentProps<typeof OccasionGridSection>)}
        />
      )

    case 'image-block':
      return null

    default:
      return null
  }
}

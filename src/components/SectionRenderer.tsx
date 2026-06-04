import type { Section, SectionType } from '@/types'
import HeroSection from './sections/HeroSection'
import BannerSection from './sections/BannerSection'
import ProductGridSection from './sections/ProductGridSection'
import CategoryGridSection from './sections/CategoryGridSection'
import TextBlockSection from './sections/TextBlockSection'
import CtaBannerSection from './sections/CtaBannerSection'
import MomentsWallSection from './sections/MomentsWallSection'
import OffersGridSection from './sections/OffersGridSection'
import WhyGatherSection from './sections/WhyGatherSection'

interface Props {
  sections: Section[]
}

export default function SectionRenderer({ sections }: Props) {
  const visible = [...sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="flex flex-col gap-14 lg:gap-20">
      {visible.map((section) => (
        <SectionSwitch key={section.id} section={section} />
      ))}
    </div>
  )
}

function SectionSwitch({ section }: { section: Section }) {
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
        />
      )

    case 'occasion-grid':
      return (
        <CategoryGridSection
          {...(section.props as React.ComponentProps<typeof CategoryGridSection>)}
          type="occasion"
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
        <OffersGridSection
          {...(section.props as React.ComponentProps<typeof OffersGridSection>)}
        />
      )

    case 'why-gather':
      return (
        <WhyGatherSection
          {...(section.props as React.ComponentProps<typeof WhyGatherSection>)}
        />
      )

    case 'image-block':
      return null

    default:
      return null
  }
}

import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'
import { getAboutPageContent } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About Gather',
  description: 'Learn about Gather and how we make celebrations easier.',
}

export default function AboutPage() {
  const content = getAboutPageContent()
  const paragraphs = content.section1.body.split('\n\n').filter(Boolean)

  return (
    <>
      <PageTitleSection title={content.pageTitle} accentWord="Gather" />
      <main className="bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <GsapReveal>
              <AnimatedTitle
                as="h2"
                text={content.section1.title}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717]"
              />
              <div className="mt-5 space-y-5 text-base sm:text-lg font-semibold leading-8 text-[#5f4b36]">
                {paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </GsapReveal>

            <div className="min-h-[280px] sm:min-h-[360px] rounded-[28px] overflow-hidden bg-[#fff4e8] shadow-[0_18px_44px_rgba(122,98,71,0.10)]">
              <img
                src={content.section1.image}
                alt="Family gathering celebration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#fffaf3] border-y border-[rgba(255,122,26,0.18)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
              <GsapReveal className="lg:order-2">
                <AnimatedTitle
                  as="h2"
                  text={content.section2.title}
                  accentWord="OFFER"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717]"
                />
                <p className="mt-5 text-base sm:text-lg font-semibold leading-8 text-[#5f4b36]">
                  {content.section2.body}
                </p>
                <ul className="mt-6 space-y-3">
                  {content.section2ListItems.map((item) => (
                    <li key={item} className="flex gap-3 text-base sm:text-lg font-bold text-[#171717]">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FE7501]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GsapReveal>

              <div className="lg:order-1 min-h-[280px] sm:min-h-[360px] rounded-[28px] overflow-hidden bg-[#fff4e8] shadow-[0_18px_44px_rgba(122,98,71,0.10)]">
                <img
                  src={content.section2.image}
                  alt="Gather cute rabbit"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
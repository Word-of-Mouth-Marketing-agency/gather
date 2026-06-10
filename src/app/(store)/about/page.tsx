import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'

export const metadata: Metadata = {
  title: 'About Gather',
  description: 'Learn about Gather and how we make celebrations easier.',
}

export default function AboutPage() {
  return (
    <>
      <PageTitleSection title="About Gather" accentWord="Gather" />
      <main className="bg-white">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <GsapReveal>
              <AnimatedTitle
                as="h2"
                text="Our Story"
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717]"
              />
              <div className="mt-5 space-y-5 text-base sm:text-lg font-semibold leading-8 text-[#5f4b36]">
                <p>
                  GATHER is an e-commerce platform created to be part of your happiest moments.
                  Our idea is simple: make celebrating easier by bringing together everything you need for gatherings, parties, and special occasions in one convenient place.
                </p>
                <p>
                  Whether you are planning a birthday, engagement, family gathering, friends’ get-together, or even a work event, GATHER helps you find the essentials quickly and easily. From decorations and balloons to snacks, desserts, chocolates, drinks, and other celebration must-haves, we aim to make the preparation process smooth, enjoyable, and stress-free.
                </p>
              </div>
            </GsapReveal>

            <div className="min-h-[280px] sm:min-h-[360px] rounded-[28px] overflow-hidden bg-[#fff4e8] shadow-[0_18px_44px_rgba(122,98,71,0.10)]">
              <img
                src="/assets/gather/occasions/family-gathering.webp"
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
                  text="What we OFFER"
                  accentWord="OFFER"
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#171717]"
                />
                <p className="mt-5 text-base sm:text-lg font-semibold leading-8 text-[#5f4b36]">
                  We offer a growing range of products for celebrations, gatherings, and events, including:
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Party decorations and celebration supplies',
                    'Balloons and occasion accessories',
                    'Snacks, desserts, and chocolates',
                    'Drinks and hosting essentials',
                    'Curated items for different types of social occasions',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-base sm:text-lg font-bold text-[#171717]">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#FE7501]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </GsapReveal>

              <div className="lg:order-1 min-h-[280px] sm:min-h-[360px] rounded-[28px] overflow-hidden bg-[#fff4e8] shadow-[0_18px_44px_rgba(122,98,71,0.10)]">
                <img
                  src="/assets/gather/cute-rabbit.webp"
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


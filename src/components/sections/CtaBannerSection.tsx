import Link from 'next/link'
import type { CtaBannerSectionProps } from '@/types'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'

export default function CtaBannerSection({ title, subtitle, ctaText, ctaUrl, variant = 'orange' }: CtaBannerSectionProps) {
  const isOrange = variant === 'orange'

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <GsapReveal
        className={`rounded-3xl px-8 py-12 text-center ${
          isOrange ? 'bg-[#ff7a1a]' : 'bg-[#fffaf3] border border-[rgba(255,122,26,0.22)]'
        }`}
      >
        <AnimatedTitle
          as="h2"
          text={title}
          className={`text-2xl sm:text-3xl font-black ${isOrange ? 'text-white' : 'text-[#171717]'}`}
        />
        {subtitle && (
          <p className={`mt-2 text-sm ${isOrange ? 'text-white/80' : 'text-[#7a6247]'}`}>
            {subtitle}
          </p>
        )}
        <Link
          href={ctaUrl}
          className={`inline-flex items-center gap-2 mt-6 px-7 py-3.5 rounded-full font-bold text-sm transition-all duration-200 hover:-translate-y-0.5 ${
            isOrange
              ? 'bg-white text-[#ff7a1a] shadow-xl hover:bg-white/90'
              : 'bg-[#ff7a1a] text-white shadow-lg hover:bg-[#fe6c00]'
          }`}
        >
          {ctaText}
        </Link>
      </GsapReveal>
    </section>
  )
}

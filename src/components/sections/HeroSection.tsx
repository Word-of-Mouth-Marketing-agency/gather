import Link from 'next/link'
import type { HeroSectionProps } from '@/types'

export default function HeroSection({ title, subtitle, ctaText, ctaUrl, image, overlayOpacity = 40 }: HeroSectionProps) {
  return (
    <section
      className="relative flex items-center justify-center min-h-[520px] lg:min-h-[640px] rounded-3xl overflow-hidden"
      style={{
        backgroundImage: image ? `url(${image})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: image ? undefined : '#ff7a1a',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity / 100 }}
        aria-hidden="true"
      />

      {/* Gradient at bottom */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg sm:text-xl text-white/85 font-medium leading-relaxed max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
        {ctaText && ctaUrl && (
          <Link
            href={ctaUrl}
            className="inline-flex items-center gap-2 mt-8 px-8 py-4 rounded-full bg-[#ff7a1a] text-white font-bold text-lg shadow-xl hover:-translate-y-0.5 hover:bg-[#fe6c00] transition-all duration-200"
          >
            {ctaText}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        )}
      </div>
    </section>
  )
}

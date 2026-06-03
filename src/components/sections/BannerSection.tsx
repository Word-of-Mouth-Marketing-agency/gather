import Link from 'next/link'
import type { BannerSectionProps } from '@/types'

export default function BannerSection({ title, subtitle, ctaText, ctaUrl, image, variant }: BannerSectionProps) {
  const inner = (
    <>
      <div
        className="relative flex items-center justify-center min-h-[280px] rounded-3xl overflow-hidden"
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: image ? undefined : '#ff7a1a',
        }}
      >
        <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white">{title}</h2>
          {subtitle && <p className="mt-2 text-white/80 text-base">{subtitle}</p>}
          {ctaText && ctaUrl && (
            <Link href={ctaUrl} className="inline-flex mt-5 gather-btn-primary shadow-xl">
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </>
  )

  if (variant === 'full-width') {
    return <section className="w-full">{inner}</section>
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{inner}</section>
  )
}

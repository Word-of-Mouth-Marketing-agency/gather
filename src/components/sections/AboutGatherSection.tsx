import Link from 'next/link'
import type { AboutGatherSectionProps } from '@/types'

export default function AboutGatherSection({
  title,
  subtitle,
  body,
  ctaText,
  ctaUrl,
  leftImage,
  rightImage,
}: AboutGatherSectionProps) {
  const parts = title.split(/(Gather)/g)

  return (
    <section className="-mt-16 sm:-mt-20">

      <div className="bg-[#FCECDC] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px] lg:min-h-[500px]">
          <div className="h-48 sm:h-64 lg:h-auto overflow-hidden">
            {leftImage && (
              <img
                src={leftImage}
                alt=""
                aria-hidden
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex items-center justify-center py-10 lg:py-16">
            <div className="max-w-lg text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#171717] leading-tight">
                {parts.map((part, i) =>
                  part.toLowerCase() === 'gather' ? (
                    <span key={i} style={{ color: '#FE7501' }}>{part}</span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </h2>
              {subtitle && (
                <p className="mt-4 text-base sm:text-lg text-[#7a6247] leading-relaxed">
                  {subtitle}
                </p>
              )}
              {body && (
                <p className="mt-3 text-sm sm:text-base text-[#7a6247]/80 leading-relaxed">
                  {body}
                </p>
              )}
              {ctaText && ctaUrl && (
                <Link
                  href={ctaUrl}
                  className="gather-btn-primary mt-6 inline-flex"
                >
                  {ctaText}
                </Link>
              )}
            </div>
          </div>

          <div className="h-48 sm:h-64 lg:h-auto overflow-hidden">
            {rightImage && (
              <img
                src={rightImage}
                alt=""
                aria-hidden
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import type { AboutGatherSectionProps } from '@/types'
import WaveBrushDivider from '@/components/WaveBrushDivider'

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
    <section>
      <WaveBrushDivider />

      <div className="bg-[#FCECDC] w-full py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="w-36 sm:w-44 lg:w-52 shrink-0">
              {leftImage && (
                <img
                  src={leftImage}
                  alt=""
                  aria-hidden
                  className="w-full h-auto object-contain"
                />
              )}
            </div>

            <div className="flex-1 text-center lg:text-left max-w-xl">
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

            <div className="w-36 sm:w-44 lg:w-52 shrink-0">
              {rightImage && (
                <img
                  src={rightImage}
                  alt=""
                  aria-hidden
                  className="w-full h-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

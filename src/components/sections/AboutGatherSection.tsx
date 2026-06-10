import Link from 'next/link'
import type { AboutGatherSectionProps } from '@/types'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'

export default function AboutGatherSection({
  title,
  subtitle,
  body,
  ctaText,
  ctaUrl,
  leftImage,
  rightImage,
}: AboutGatherSectionProps) {
  return (
    <section>

      <div className="bg-[#FCECDC] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[400px] lg:min-h-[500px]">
          <div className="aspect-square w-full overflow-hidden bg-[#FCECDC] lg:aspect-auto lg:h-auto">
            {leftImage && (
              <img
                src={leftImage}
                alt=""
                aria-hidden
                className="h-full w-full object-contain lg:object-cover"
              />
            )}
          </div>

          <div className="flex items-center justify-center py-10 lg:py-16">
            <GsapReveal className="max-w-lg text-center" y={18}>
              <AnimatedTitle
                as="h2"
                text={title}
                accentWord="Gather"
                className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#171717] leading-tight"
              />
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
            </GsapReveal>
          </div>

          <div className="aspect-square w-full overflow-hidden bg-[#FCECDC] lg:aspect-auto lg:h-auto">
            {rightImage && (
              <img
                src={rightImage}
                alt=""
                aria-hidden
                className="h-full w-full object-contain lg:object-cover"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

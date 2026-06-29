'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { OffersGridSectionProps } from '@/types'
import { getActiveBundles } from '@/lib/data'
import BundleCard from '@/components/BundleCard'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'

export default function OffersBundlesSection({ title, subtitle }: OffersGridSectionProps) {
  const bundles = getActiveBundles().sort((a, b) => a.sortOrder - b.sortOrder)
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const [translateY, setTranslateY] = useState(0)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const handleScroll = () => {
      const rect = el.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)))
      setTranslateY(progress * -800)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const total = bundles.length

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrent(((index % total) + total) % total)
      setTimeout(() => setIsTransitioning(false), 400)
    },
    [total, isTransitioning]
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  if (total === 0) return null

  return (
    <section ref={sectionRef} className="relative w-full bg-cover bg-center bg-no-repeat py-16 sm:py-20"
      style={{ backgroundImage: "url('/assets/gather/offers-bg.webp')" }}
    >
      <div
        className="absolute top-0 right-0 w-40 h-40 sm:w-52 sm:h-52 lg:w-64 lg:h-64 pointer-events-none select-none z-40"
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <img
          src="/assets/gather/floating-rabbit.webp"
          alt=""
          className="w-full h-full object-contain"
          aria-hidden
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <AnimatedTitle
              as="h2"
              text={title}
              className="text-2xl sm:text-3xl font-black text-[#171717]"
            />
            {subtitle && <p className="mt-1 text-sm text-[#7a6247]">{subtitle}</p>}
          </div>

          {total > 1 && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={prev}
                className="w-10 h-10 rounded-full bg-white border border-[#f1e2d3] flex items-center justify-center text-lg text-[#7a6247] hover:text-[#ff7a1a] hover:border-[#ff7a1a] transition-colors"
                aria-label="Previous offer"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="w-10 h-10 rounded-full bg-white border border-[#f1e2d3] flex items-center justify-center text-lg text-[#7a6247] hover:text-[#ff7a1a] hover:border-[#ff7a1a] transition-colors"
                aria-label="Next offer"
              >
                ›
              </button>
            </div>
          )}
        </div>

        <div className="overflow-hidden" ref={trackRef}>
          <GsapReveal
            className="flex transition-transform ease-in-out duration-[400ms]"
            itemSelector="[data-reveal-item]"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {bundles.map((bundle) => (
              <div key={bundle.id} data-reveal-item className="w-full shrink-0 px-0.5">
                <BundleCard bundle={bundle} />
              </div>
            ))}
          </GsapReveal>
        </div>

        {total > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {bundles.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === current ? 'bg-[#ff7a1a] w-6' : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to bundle ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useState, useCallback, useRef } from 'react'
import type { OffersGridSectionProps } from '@/types'
import { getAllBundles } from '@/lib/data'
import { useScrollParallax } from '@/lib/useScrollParallax'
import BundleCard from '@/components/BundleCard'

export default function OffersBundlesSection({ title, subtitle }: OffersGridSectionProps) {
  const bundles = getAllBundles()
  const [current, setCurrent] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const { ref: sectionRef, translateY } = useScrollParallax({ maxTranslate: -100 })

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
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={sectionRef}>
      <div
        className="absolute -top-16 sm:-top-20 right-4 sm:right-8 w-20 h-20 sm:w-24 sm:h-24 pointer-events-none select-none z-10"
        style={{ transform: `translateY(${translateY}px)` }}
      >
        <img
          src="/assets/gather/floating-rabbit.webp"
          alt=""
          className="w-full h-full object-contain"
          aria-hidden
        />
      </div>

      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">{title}</h2>
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
        <div
          className="flex transition-transform ease-in-out duration-[400ms]"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {bundles.map((bundle) => (
            <div key={bundle.id} className="w-full shrink-0 px-0.5">
              <BundleCard bundle={bundle} />
            </div>
          ))}
        </div>
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
    </section>
  )
}

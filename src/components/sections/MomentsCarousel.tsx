'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import GsapReveal from '@/components/GsapReveal'

interface Props {
  images: string[]
  gap?: number
}

function getSlidesPerView(): number {
  if (typeof window === 'undefined') return 5
  if (window.innerWidth >= 1024) return 5
  if (window.innerWidth >= 640) return 3
  return 1
}

export default function MomentsCarousel({ images, gap = 20 }: Props) {
  const [current, setCurrent] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(() => getSlidesPerView())
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalSlides = images.length
  const maxIndex = Math.max(0, totalSlides - slidesPerView)

  useEffect(() => {
    const onResize = () => {
      const spv = getSlidesPerView()
      setSlidesPerView(spv)
      setCurrent((prev) => Math.min(prev, Math.max(0, totalSlides - spv)))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [totalSlides])

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrent(Math.max(0, Math.min(index, maxIndex)))
      setTimeout(() => setIsTransitioning(false), 500)
    },
    [maxIndex, isTransitioning]
  )

  const next = useCallback(() => {
    if (current >= maxIndex) goTo(0)
    else goTo(current + 1)
  }, [current, maxIndex, goTo])

  const prev = useCallback(() => {
    if (current <= 0) goTo(maxIndex)
    else goTo(current - 1)
  }, [current, maxIndex, goTo])

  useEffect(() => {
    if (isPaused || totalSlides <= slidesPerView) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [next, isPaused, totalSlides, slidesPerView])

  const bulletCount = maxIndex + 1

  if (totalSlides === 0) return null

  const itemWidth = `calc((100% - ${gap * (slidesPerView - 1)}px) / ${slidesPerView})`

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={containerRef}
    >
      <div className="overflow-hidden">
        <GsapReveal
          className="flex transition-transform ease-in-out"
          itemSelector="[data-reveal-item]"
          stagger={0.06}
          style={{
            transform: `translateX(calc(-${current} * (${itemWidth} + ${gap}px)))`,
            transitionDuration: '500ms',
            gap: `${gap}px`,
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              data-reveal-item
              className="shrink-0 overflow-hidden rounded-2xl"
              style={{ width: itemWidth }}
            >
              <img
                src={src}
                alt={`Gather moment ${i + 1}`}
                loading="lazy"
                className="w-full aspect-square object-cover"
              />
            </div>
          ))}
        </GsapReveal>
      </div>

      {totalSlides > slidesPerView && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-[#FE7501] transition-colors z-10"
            aria-label="Previous moments"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-[#FE7501] transition-colors z-10"
            aria-label="Next moments"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {bulletCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: bulletCount }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    i === current
                      ? 'bg-[#FE7501] w-6'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

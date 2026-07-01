'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocale } from '@/components/LocaleProvider'

interface Props {
  images: string[]
  gap?: number
}

const DEFAULT_SLIDES_PER_VIEW = 5

function getSlidesPerView(): number {
  if (window.innerWidth >= 1024) return 5
  if (window.innerWidth >= 640) return 3
  return 1
}

export default function MomentsCarousel({ images, gap = 20 }: Props) {
  const [current, setCurrent] = useState(0)
  const [slidesPerView, setSlidesPerView] = useState(DEFAULT_SLIDES_PER_VIEW)
  const [isPaused, setIsPaused] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isRTL } = useLocale()

  const totalSlides = images.length
  const maxIndex = Math.max(0, totalSlides - slidesPerView)

  useEffect(() => {
    const onResize = () => {
      const spv = getSlidesPerView()
      setSlidesPerView(spv)
      setCurrent((prev) => Math.min(prev, Math.max(0, totalSlides - spv)))
    }
    onResize()
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

  const translatePercent = (current / slidesPerView) * 100
  const translateGap = (current * gap) / slidesPerView

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={containerRef}
    >
      <div className="overflow-hidden">
        <div
          className="flex gap-5 transition-transform ease-in-out"
          style={{
            transform: isRTL
              ? `translateX(calc(${translatePercent}% + ${translateGap}px))`
              : `translateX(calc(-${translatePercent}% - ${translateGap}px))`,
            transitionDuration: '500ms',
          }}
        >
          {images.map((src, i) => (
            <div
              key={i}
              className="shrink-0 basis-full overflow-hidden rounded-2xl sm:basis-[calc((100%_-_40px)_/_3)] lg:basis-[calc((100%_-_80px)_/_5)]"
            >
              <img
                src={src}
                alt={`Gather moment ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'auto'}
                className="w-full aspect-square object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {totalSlides > slidesPerView && (
        <>
          <button
            onClick={prev}
            className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-[#FE7501] transition-colors z-10 ${
              isRTL ? 'right-0 -translate-x-4' : 'left-0 -translate-x-4'
            }`}
            aria-label="Previous moments"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={isRTL ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
            </svg>
          </button>

          <button
            onClick={next}
            className={`absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-[#FE7501] transition-colors z-10 ${
              isRTL ? 'left-0 translate-x-4' : 'right-0 translate-x-4'
            }`}
            aria-label="Next moments"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
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

'use client'

import { useState, useEffect, useCallback } from 'react'

const SLIDES = [
  { src: '/assets/gather/banner1.webp', alt: 'Premium gifts for every occasion' },
  { src: '/assets/gather/banner2.webp', alt: 'Same-day delivery across Cairo' },
  { src: '/assets/gather/banner3.webp', alt: 'Celebrate with Gather' },
]

const SLIDE_INTERVAL = 6000
const TRANSITION_MS = 800

export default function HeroSlideshow() {
  const [active, setActive] = useState(0)

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % SLIDES.length)
  }, [])

  useEffect(() => {
    const id = setInterval(next, SLIDE_INTERVAL)
    return () => clearInterval(id)
  }, [next])

  return (
    <section className="relative w-full overflow-hidden bg-gray-100 min-h-[280px] aspect-video">
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          className="absolute inset-0"
          style={{
            opacity: i === active ? 1 : 0,
            transition: `opacity ${TRANSITION_MS}ms ease-in-out`,
          }}
          aria-hidden={i !== active}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover"
            fetchPriority={i === 0 ? 'high' : 'low'}
          />
        </div>
      ))}
    </section>
  )
}

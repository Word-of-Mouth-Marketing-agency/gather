'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import gsap from 'gsap'

const SLIDES = [
  { src: '/assets/gather/banner1.webp', alt: 'Premium gifts for every occasion' },
  { src: '/assets/gather/banner2.webp', alt: 'Same-day delivery across Cairo' },
  { src: '/assets/gather/banner3.webp', alt: 'Celebrate with Gather' },
]

const SLIDE_INTERVAL = 6000
const TRANSITION_MS = 800

export default function HeroSlideshow() {
  const [active, setActive] = useState(0)
  const copyRef = useRef<HTMLDivElement>(null)

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % SLIDES.length)
  }, [])

  useEffect(() => {
    const id = setInterval(next, SLIDE_INTERVAL)
    return () => clearInterval(id)
  }, [next])

  useEffect(() => {
    const root = copyRef.current
    if (!root) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-hero-copy]'))
    const context = gsap.context(() => {
      gsap.from(elements, {
        autoAlpha: 0,
        y: 28,
        duration: 0.72,
        ease: 'power3.out',
        stagger: 0.14,
        delay: 0.15,
      })
    }, root)

    return () => context.revert()
  }, [])

  return (
    <section className="relative w-full overflow-hidden bg-gray-100 min-h-[360px] sm:min-h-[460px] lg:min-h-[620px] aspect-[4/5] sm:aspect-video">
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

      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div ref={copyRef} className="max-w-[680px] text-white">
            <p
              data-hero-copy
              className="text-sm sm:text-base lg:text-lg font-black uppercase tracking-[0.18em] text-[#ffd8b5]"
            >
              Gather,
            </p>
            <h1
              data-hero-copy
              className="mt-3 text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] drop-shadow-[0_3px_16px_rgba(0,0,0,0.35)]"
            >
              Bring Us Together
            </h1>
            <p
              data-hero-copy
              className="mt-5 max-w-xl text-base sm:text-xl lg:text-2xl font-bold leading-relaxed text-white/95"
            >
              Everything your gathering needs.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

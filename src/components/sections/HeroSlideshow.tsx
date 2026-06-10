'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
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

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div ref={copyRef} className="max-w-[820px] text-white">
            <p
              data-hero-copy
              className="text-6xl sm:text-8xl lg:text-9xl font-black leading-none text-white"
              style={{
                WebkitTextStroke: '1.5px #FE7501',
                textShadow: '4px 5px 0 rgba(0,0,0,0.78)',
              }}
            >
              Gather,
            </p>
            <h1
              data-hero-copy
              className="mt-2 text-4xl sm:text-6xl lg:text-7xl font-black leading-[0.95] text-white"
              style={{
                WebkitTextStroke: '1px #FE7501',
                textShadow: '3px 4px 0 rgba(0,0,0,0.75)',
              }}
            >
              Bring Us Together
            </h1>
            <p
              data-hero-copy
              className="mt-5 max-w-xl text-lg sm:text-2xl lg:text-3xl font-black leading-tight text-white"
              style={{
                WebkitTextStroke: '0.6px #DB7100',
                textShadow: '2px 3px 0 rgba(0,0,0,0.72)',
              }}
            >
              Everything your gathering needs.
            </p>
            <div
              data-hero-copy
              className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link
                href="/shop-by-category"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#FE7501] px-7 py-3 text-sm sm:text-base font-black text-white shadow-[3px_4px_0_rgba(0,0,0,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#DB7100]"
              >
                Shop Now
              </Link>
              <Link
                href="/shop-by-occasion"
                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#FE7501] bg-white px-7 py-3 text-sm sm:text-base font-black text-[#171717] shadow-[3px_4px_0_rgba(0,0,0,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff4e8]"
              >
                Shop by Occasion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

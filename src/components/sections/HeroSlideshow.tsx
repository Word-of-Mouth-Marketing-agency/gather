'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import gsap from 'gsap'

const SLIDES = [
  {
    src: '/assets/gather/banner1.webp',
    mobileSrc: '/assets/gather/mobile-banner1.webp',
    alt: 'Premium gifts for every occasion',
  },
  {
    src: '/assets/gather/banner2.webp',
    mobileSrc: '/assets/gather/mobile-banner2.webp',
    alt: 'Same-day delivery across Cairo',
  },
  {
    src: '/assets/gather/banner3.webp',
    mobileSrc: '/assets/gather/mobile-banner3.webp',
    alt: 'Celebrate with Gather',
  },
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
    <section className="relative w-full overflow-hidden bg-gray-100 aspect-[863/1822] sm:aspect-video sm:min-h-[clamp(320px,52vw,560px)]">
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
          <picture className="block h-full w-full">
            <source media="(max-width: 639px)" srcSet={slide.mobileSrc} />
            <img
              src={slide.src}
              alt={slide.alt}
              className="w-full h-full object-contain sm:object-cover"
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
          </picture>
        </div>
      ))}

      <div className="absolute inset-0 flex items-start justify-center pt-[clamp(2rem,11vw,4rem)] sm:items-center sm:justify-start sm:pt-0">
        <div className="mx-auto w-full max-w-7xl px-[clamp(1rem,4vw,4rem)]">
          <div ref={copyRef} className="mx-auto max-w-[min(680px,92vw)] text-center text-white sm:ml-[clamp(0.75rem,5vw,4rem)] sm:mr-0 sm:text-left xl:ml-0">
            <p
              data-hero-copy
              className="font-black leading-none text-white"
              style={{
                fontSize: 'clamp(2.55rem, 6.4vw, 5.2rem)',
                WebkitTextStroke: 'clamp(0.7px, 0.1vw, 1px) #FE7501',
                textShadow: 'clamp(2px, 0.28vw, 3px) clamp(2px, 0.36vw, 4px) 0 rgba(0,0,0,0.72)',
              }}
            >
              Gather
            </p>
            <h1
              data-hero-copy
              className="mt-[clamp(0.25rem,0.8vw,0.6rem)] font-black leading-[0.96] text-white"
              style={{
                fontSize: 'clamp(1.65rem, 4vw, 3.35rem)',
                WebkitTextStroke: 'clamp(0.45px, 0.08vw, 0.8px) #FE7501',
                textShadow: 'clamp(1px, 0.22vw, 2px) clamp(2px, 0.3vw, 3px) 0 rgba(0,0,0,0.72)',
              }}
            >
              Bring Us Together
            </h1>
            <p
              data-hero-copy
              className="mt-[clamp(0.75rem,1.5vw,1.25rem)] max-w-[36rem] font-black leading-tight text-white"
              style={{
                fontSize: 'clamp(1rem, 1.6vw, 1.35rem)',
                WebkitTextStroke: 'clamp(0.25px, 0.05vw, 0.45px) #DB7100',
                textShadow: '1px 2px 0 rgba(0,0,0,0.7)',
              }}
            >
              Everything your gathering needs.
            </p>
            <div
              data-hero-copy
              className="mt-[clamp(1rem,2.2vw,1.75rem)] flex flex-col items-center gap-[clamp(0.6rem,1.2vw,1rem)] min-[420px]:flex-row min-[420px]:justify-center sm:items-stretch sm:justify-start"
            >
              <a
                href="#featured-gifts"
                className="inline-flex items-center justify-center rounded-full bg-[#FE7501] font-black text-white shadow-[2px_3px_0_rgba(0,0,0,0.72)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#DB7100]"
                style={{
                  minHeight: 'clamp(2.4rem, 3.7vw, 2.8rem)',
                  paddingInline: 'clamp(1.1rem, 2.2vw, 1.6rem)',
                  paddingBlock: 'clamp(0.52rem, 0.95vw, 0.72rem)',
                  fontSize: 'clamp(0.82rem, 1.08vw, 0.96rem)',
                }}
              >
                Shop Now
              </a>
              <a
                href="#shop-by-occasion"
                className="inline-flex items-center justify-center rounded-full border-2 border-[#FE7501] bg-white font-black text-[#171717] shadow-[2px_3px_0_rgba(0,0,0,0.62)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#fff4e8]"
                style={{
                  minHeight: 'clamp(2.4rem, 3.7vw, 2.8rem)',
                  paddingInline: 'clamp(1.1rem, 2.2vw, 1.6rem)',
                  paddingBlock: 'clamp(0.52rem, 0.95vw, 0.72rem)',
                  fontSize: 'clamp(0.82rem, 1.08vw, 0.96rem)',
                }}
              >
                Shop by Occasion
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

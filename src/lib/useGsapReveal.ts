'use client'

import { RefObject, useEffect } from 'react'
import gsap from 'gsap'

interface RevealOptions {
  targets?: string
  y?: number
  stagger?: number
  duration?: number
  amount?: number
}

export function useGsapReveal<T extends HTMLElement>(
  ref: RefObject<T | null>,
  {
    targets,
    y = 24,
    stagger = 0.06,
    duration = 0.6,
    amount = 0.22,
  }: RevealOptions = {}
) {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) return

    const elements = targets
      ? Array.from(root.querySelectorAll<HTMLElement>(targets))
      : [root]

    if (elements.length === 0) return

    const context = gsap.context(() => {
      gsap.set(elements, { autoAlpha: 0, y })
    }, root)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        gsap.context(() => {
          gsap.to(
            elements,
            {
              autoAlpha: 1,
              y: 0,
              duration,
              ease: 'power3.out',
              stagger,
            }
          )
        }, root)
        observer.disconnect()
      },
      { threshold: amount }
    )

    observer.observe(root)

    return () => {
      observer.disconnect()
      context.revert()
    }
  }, [amount, duration, ref, stagger, targets, y])
}

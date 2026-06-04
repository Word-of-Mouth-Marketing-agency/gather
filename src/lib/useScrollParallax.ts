'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Options {
  maxTranslate?: number
}

export function useScrollParallax({ maxTranslate = -120 }: Options = {}) {
  const [translateY, setTranslateY] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const rectRef = useRef<DOMRect | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          rectRef.current = entry.boundingClientRect
          setIsInView(true)
        } else {
          setIsInView(false)
        }
      },
      { threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    if (!isInView || !ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const sectionTop = rect.top
    const sectionHeight = rect.height

    const progress = Math.max(0, Math.min(1, (windowHeight - sectionTop) / (windowHeight + sectionHeight)))

    setTranslateY(progress * maxTranslate)
  }, [isInView, maxTranslate])

  useEffect(() => {
    if (!isInView) return
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isInView, handleScroll])

  return { ref, translateY }
}

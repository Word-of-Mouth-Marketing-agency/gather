'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import gsap from 'gsap'

const FALLBACK_TRANSITION_MS = 1400

export default function RabbitPageTransition() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams]
  )
  const [visible, setVisible] = useState(false)
  const [runId, setRunId] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousRoute = useRef<string | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (previousRoute.current === null) {
      previousRoute.current = routeKey
      return
    }

    if (previousRoute.current === routeKey) return
    previousRoute.current = routeKey

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (pathname.startsWith('/admin')) return

    if (startRef.current) window.clearTimeout(startRef.current)
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    startRef.current = window.setTimeout(() => {
      setVisible(true)
      setRunId((current) => current + 1)
      if (reduceMotion) {
        timeoutRef.current = window.setTimeout(() => setVisible(false), 180)
      } else {
        timeoutRef.current = window.setTimeout(() => setVisible(false), FALLBACK_TRANSITION_MS)
      }
    }, 0)

    return () => {
      if (startRef.current) window.clearTimeout(startRef.current)
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    }
  }, [pathname, routeKey])

  useEffect(() => {
    if (!visible || !overlayRef.current) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const context = gsap.context(() => {
      if (reduceMotion) {
        gsap.fromTo(
          overlayRef.current,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.08,
            ease: 'power1.out',
            onComplete: () => {
              gsap.to(overlayRef.current, {
                autoAlpha: 0,
                duration: 0.08,
                delay: 0.04,
                ease: 'power1.in',
                onComplete: () => setVisible(false),
              })
            },
          }
        )
        return
      }

      gsap.fromTo(
        overlayRef.current,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.45,
          ease: 'power3.inOut',
          onComplete: () => {
            gsap.to(overlayRef.current, {
              yPercent: -100,
              duration: 0.45,
              delay: 0.25,
              ease: 'power3.inOut',
              onComplete: () => setVisible(false),
            })
          },
        }
      )
    }, overlayRef)

    return () => context.revert()
  }, [runId, visible])

  if (!visible) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden bg-white"
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/gather/running-rabbit.gif"
        alt=""
        className="w-36 sm:w-48 lg:w-56 h-auto object-contain"
      />
    </div>
  )
}

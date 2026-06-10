'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import gsap from 'gsap'

const ENTER_DURATION = 0.6
const HOLD_DURATION = 0.35
const EXIT_DURATION = 0.65
const REDUCED_DURATION = 0.12

export default function RabbitPageTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams]
  )
  const [visible, setVisible] = useState(false)
  const [runId, setRunId] = useState(0)
  const overlayRef = useRef<HTMLDivElement>(null)
  const routeKeyRef = useRef(routeKey)
  const isTransitioningRef = useRef(false)
  const hasNavigatedRef = useRef(false)
  const pendingHrefRef = useRef<string | null>(null)
  const enterTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const finishTransition = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    enterTimelineRef.current?.kill()
    exitTimelineRef.current?.kill()
    pendingHrefRef.current = null
    hasNavigatedRef.current = false
    isTransitioningRef.current = false
    setVisible(false)
  }, [])

  const navigateAfterCover = useCallback(
    (href: string | null) => {
      if (!href || hasNavigatedRef.current) return

      hasNavigatedRef.current = true
      router.push(href)
      timeoutRef.current = window.setTimeout(() => {
        if (isTransitioningRef.current) finishTransition()
      }, 5000)
    },
    [finishTransition, router]
  )

  useEffect(() => {
    routeKeyRef.current = routeKey
  }, [routeKey])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      enterTimelineRef.current?.kill()
      exitTimelineRef.current?.kill()
    }
  }, [])

  useEffect(() => {
    function getInternalHref(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return null
      }

      const target = event.target
      if (!(target instanceof Element)) return null

      if (overlayRef.current?.contains(target)) return null

      const link = target.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement)) return null
      if (link.target && link.target !== '_self') return null
      if (link.hasAttribute('download')) return null

      const href = link.getAttribute('href')
      if (!href || href.startsWith('#')) return null

      const url = new URL(link.href)
      if (url.origin !== window.location.origin) return null
      if (url.pathname.startsWith('/admin')) return null

      const current = new URL(window.location.href)
      if (url.href === current.href) return null
      if (url.pathname === current.pathname && url.search === current.search && url.hash) return null

      return `${url.pathname}${url.search}${url.hash}`
    }

    function handleClick(event: MouseEvent) {
      if (isTransitioningRef.current) return

      const href = getInternalHref(event)
      if (!href) return

      event.preventDefault()
      isTransitioningRef.current = true
      hasNavigatedRef.current = false
      pendingHrefRef.current = href
      enterTimelineRef.current?.kill()
      exitTimelineRef.current?.kill()
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)

      setVisible(true)
      setRunId((current) => current + 1)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [])

  useEffect(() => {
    if (!hasNavigatedRef.current || !isTransitioningRef.current) return
    if (!visible || !overlayRef.current) return

    enterTimelineRef.current?.kill()
    exitTimelineRef.current?.kill()
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      exitTimelineRef.current = gsap.timeline({
        onComplete: finishTransition,
      })
      exitTimelineRef.current.to(overlayRef.current, {
        autoAlpha: 0,
        duration: REDUCED_DURATION,
        ease: 'power1.in',
      })
      return
    }

    exitTimelineRef.current = gsap.timeline({
      defaults: { ease: 'power3.inOut' },
      onComplete: finishTransition,
    })
    exitTimelineRef.current
      .to({}, { duration: HOLD_DURATION })
      .to(overlayRef.current, {
        yPercent: -100,
        duration: EXIT_DURATION,
      })

    return () => {
      exitTimelineRef.current?.kill()
    }
  }, [finishTransition, routeKey, visible])

  useEffect(() => {
    if (!visible || !overlayRef.current) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const href = pendingHrefRef.current

    const context = gsap.context(() => {
      if (reduceMotion) {
        enterTimelineRef.current = gsap.timeline({
          onComplete: () => navigateAfterCover(href),
        })
        enterTimelineRef.current.fromTo(
          overlayRef.current,
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: REDUCED_DURATION, ease: 'power1.out' }
        )
        return
      }

      enterTimelineRef.current = gsap.timeline({
        defaults: { ease: 'power3.inOut' },
        onComplete: () => navigateAfterCover(href),
      })
      enterTimelineRef.current.fromTo(
        overlayRef.current,
        { yPercent: 100, autoAlpha: 1 },
        {
          yPercent: 0,
          duration: ENTER_DURATION,
        }
      )
    }, overlayRef)

    return () => {
      enterTimelineRef.current?.kill()
      context.revert()
    }
  }, [navigateAfterCover, runId, visible])

  if (!visible) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 h-screen w-screen z-[9999] pointer-events-auto touch-none overscroll-none flex items-center justify-center overflow-hidden bg-white"
      aria-hidden
    >
      <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/gather/running-rabbit.gif"
          alt=""
          className="w-44 sm:w-56 lg:w-80 h-auto object-contain"
        />
        <p className="text-base sm:text-lg font-bold text-[#171717]">
          loading your happy moments...
        </p>
      </div>
    </div>
  )
}

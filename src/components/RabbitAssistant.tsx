'use client'

import { useState, useEffect, useRef, startTransition } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function RabbitAssistant() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    startTransition(() => { setMounted(true) })
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY)
        rafRef.current = null
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  if (!mounted || pathname.startsWith('/admin')) return null

  const translateY = Math.min(scrollY * 0.04, 28)

  return (
    <div
      className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-1.5rem)]"
      style={{ transform: `translateY(-${translateY}px)` }}
    >
      <a
        href="https://wa.me/201000000000?text=Hi%20GATHER%2C%20I%20need%20help%20with%20my%20order."
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3"
      >
        <span className="bg-white text-[#171717] text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg whitespace-nowrap">
          Need help?
        </span>
        <div className="w-[56px] h-[56px] sm:w-[80px] sm:h-[80px] shrink-0 rounded-full bg-[#fff4e8] border-2 border-[#FE7501] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden">
          <Image
            src="/assets/gather/rabbit/favicon.png"
            alt="Gather Rabbit"
            width={44}
            height={44}
            className="object-contain sm:w-[64px] sm:h-[64px]"
          />
        </div>
      </a>
    </div>
  )
}

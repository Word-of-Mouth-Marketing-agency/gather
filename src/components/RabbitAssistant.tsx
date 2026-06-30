'use client'

import { useState, useEffect, startTransition } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const FALLBACK_HREF = 'https://wa.me/201000000000?text=Hi%20GATHER%2C%20I%20need%20help%20with%20my%20order.'

export default function RabbitAssistant() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [whatsappHref, setWhatsappHref] = useState(FALLBACK_HREF)

  useEffect(() => {
    startTransition(() => { setMounted(true) })
  }, [])

  useEffect(() => {
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.whatsappMessageHref) setWhatsappHref(data.whatsappMessageHref)
      })
      .catch(() => {})
  }, [])

  if (!mounted || pathname.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-1.5rem)]">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3"
      >
        <span className="bg-white text-[#171717] text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg whitespace-nowrap">
          Need help?
        </span>
        <div className="w-[48px] h-[48px] sm:w-[68px] sm:h-[68px] shrink-0 rounded-full bg-[#fff4e8] border-2 border-[#FE7501] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden">
          <Image
            src="/assets/gather/rabbit/favicon.png"
            alt="Gather Rabbit"
            width={40}
            height={40}
            className="object-contain sm:w-[56px] sm:h-[56px]"
          />
        </div>
      </a>
    </div>
  )
}

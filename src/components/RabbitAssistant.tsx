'use client'

import { useState, useEffect, startTransition } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function RabbitAssistant() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    startTransition(() => { setMounted(true) })
  }, [])

  if (!mounted || pathname.startsWith('/admin')) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <a
        href="https://wa.me/201000000000?text=Hi%20GATHER%2C%20I%20need%20help%20with%20my%20order."
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3"
      >
        <span className="hidden sm:block bg-white text-[#171717] text-sm font-bold px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
          Need help?
        </span>
        <div className="w-[68px] h-[68px] shrink-0 rounded-full bg-[#fff4e8] border-2 border-[#FE7501] flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden">
          <Image
            src="/assets/gather/rabbit/favicon.png"
            alt="Gather Rabbit"
            width={56}
            height={56}
            className="object-contain"
          />
        </div>
      </a>
    </div>
  )
}

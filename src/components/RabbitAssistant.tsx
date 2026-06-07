'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { getCart, addToCart } from '@/lib/cart'
import { getCartSuggestions } from '@/lib/cart-suggestions'
import type { Product } from '@/types'
import RabbitSuggestionsModal from './RabbitSuggestionsModal'

function isCartOrCheckoutHref(href: string | null): string | null {
  if (!href) return null
  if (href === '/cart' || href === '/checkout') return href
  if (href.startsWith('/cart') || href.startsWith('/checkout')) return href
  return null
}

export default function RabbitAssistant() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const pendingDestination = useRef<string | null>(null)
  const interceptedRef = useRef(false)

  useEffect(() => {
    startTransition(() => { setMounted(true) })
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (pathname.startsWith('/admin')) return

    const handler = (e: MouseEvent) => {
      if (interceptedRef.current) return
      const link = (e.target as HTMLElement)?.closest<HTMLAnchorElement>('a')
      if (!link) return
      const href = isCartOrCheckoutHref(link.getAttribute('href'))
      if (!href) return
      const cart = getCart()
      if (cart.length === 0) return

      e.preventDefault()
      e.stopPropagation()
      interceptedRef.current = true
      pendingDestination.current = href
      const prods = getCartSuggestions(cart)
      setSuggestions(prods)
      setModalOpen(true)
    }

    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [mounted, pathname])

  const handleAddExtras = useCallback(
    (selected: Product[]) => {
      for (const product of selected) {
        addToCart(product.id, 1)
      }
      setModalOpen(false)
      setSuggestions([])
      const dest = pendingDestination.current
      pendingDestination.current = null
      interceptedRef.current = false
      if (dest) router.push(dest)
    },
    [router]
  )

  const handleContinue = useCallback(() => {
    setModalOpen(false)
    setSuggestions([])
    const dest = pendingDestination.current
    pendingDestination.current = null
    interceptedRef.current = false
    if (dest) router.push(dest)
  }, [router])

  if (!mounted || pathname.startsWith('/admin')) return null

  return (
    <>
      <RabbitSuggestionsModal
        open={modalOpen}
        suggestions={suggestions}
        onAddExtras={handleAddExtras}
        onContinue={handleContinue}
      />

      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <a
          href="https://wa.me/201000000000?text=Hi%20GATHER%2C%20I%20need%20help%20with%20my%20order."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 group"
        >
          <span className="hidden sm:block bg-white text-[#171717] text-sm font-bold px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
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
    </>
  )
}

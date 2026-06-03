'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCart, getCartItemCount } from '@/lib/cart'

export default function CartIcon() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(getCartItemCount(getCart()))
    update()
    window.addEventListener('gather:cart-updated', update)
    return () => window.removeEventListener('gather:cart-updated', update)
  }, [])

  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
      aria-label={`Cart — ${count} items`}
    >
      <svg
        className="w-5 h-5 text-gray-700"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zm0 0h12M16 10a4 4 0 01-8 0"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#ff7a1a] text-white text-[10px] font-black flex items-center justify-center px-0.5">
          {count}
        </span>
      )}
    </Link>
  )
}

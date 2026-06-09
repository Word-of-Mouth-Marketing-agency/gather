'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCustomerSession } from '@/lib/customer-auth'

export default function PreFooterSignupCTA() {
  const pathname = usePathname()
  const session = useCustomerSession()
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false)

  if (!mounted || pathname.startsWith('/products/') || pathname.startsWith('/my-account') || pathname === '/login' || pathname === '/signup' || pathname === '/checkout') return null

  return (
    <section className="relative w-full bg-[#fffaf3] mt-8 sm:mt-12 lg:mt-16 pt-8 sm:pt-12 lg:pt-14 pb-4 sm:pb-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute left-0 bottom-0 w-48 h-48 sm:w-56 sm:h-56 lg:w-72 lg:h-72 pointer-events-none select-none hidden sm:block">
          <img
            src="/assets/gather/sitting-rabbit.webp"
            alt=""
            className="w-full h-full object-contain object-left-bottom"
            aria-hidden
          />
        </div>

        <div className="sm:pl-48 lg:pl-72 text-center lg:text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#171717]">
            Join the Gather Family
          </h2>
          <p className="mt-4 text-base sm:text-lg font-bold leading-relaxed text-[#7a6247] max-w-2xl lg:max-w-none">
            Don&apos;t miss to sign up to join Gather Family/club to enjoy attractive offers and benefits.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
            <Link
              href={session ? '/my-account' : '/signup'}
              className="gather-btn-primary px-8 py-3.5 text-base shadow-lg"
            >
              Sign Up
            </Link>
            <Link href="/my-account" className="gather-btn-secondary px-8 py-3.5 text-base">
              My Account
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function subscribeToMount(onStoreChange: () => void) {
  onStoreChange()
  return () => {}
}

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
    <section className="relative w-full bg-[#fffaf3] mt-8 sm:mt-12 lg:mt-16">
      {/* Subtle background glow circles */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'rgba(255,122,26,0.04)', transform: 'translate(33%, -50%)' }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'rgba(255,122,26,0.04)', transform: 'translateY(33%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 lg:pt-18 pb-4 sm:pb-0">
        {/* Decorative sitting rabbit — overlaps into footer */}
        <div className="absolute left-6 sm:left-8 lg:left-12 bottom-0 w-40 h-40 sm:w-48 sm:h-48 lg:w-64 lg:h-64 translate-y-1/4 pointer-events-none select-none hidden sm:block z-10">
          <img
            src="/assets/gather/sitting-rabbit.webp"
            alt=""
            className="w-full h-full object-contain object-left-bottom"
            aria-hidden
          />
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#171717]">
            Join the Gather Family
          </h2>
          <p className="mt-4 text-base sm:text-lg font-bold leading-relaxed text-[#7a6247]">
            Don&apos;t miss to sign up to join Gather Family/club to enjoy attractive offers and benefits.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
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

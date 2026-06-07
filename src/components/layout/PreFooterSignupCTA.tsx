'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCustomerSession } from '@/lib/customer-auth'

export default function PreFooterSignupCTA() {
  const pathname = usePathname()
  const session = useCustomerSession()
  const mounted = useSyncExternalStore(subscribeToMount, () => true, () => false)

  if (!mounted || pathname.startsWith('/products/') || pathname.startsWith('/my-account')) return null

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto overflow-hidden rounded-[32px] bg-[#fff4e8] border border-[rgba(255,122,26,0.22)] shadow-[0_18px_44px_rgba(122,98,71,0.12)]">
        <div className="relative px-6 py-10 sm:px-10 lg:px-12 lg:py-12">
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 text-center lg:text-left">
            <div className="max-w-2xl">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-[#171717]">
                Join the Gather Family
              </h2>
              <p className="mt-4 text-base sm:text-lg font-bold leading-relaxed text-[#7a6247]">
                Don&apos;t miss to sign up to join Gather Family/club to enjoy attractive offers and benefits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-end gap-3 sm:gap-4 lg:shrink-0">
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
      </div>
    </section>
  )
}

function subscribeToMount(onStoreChange: () => void) {
  onStoreChange()
  return () => {}
}

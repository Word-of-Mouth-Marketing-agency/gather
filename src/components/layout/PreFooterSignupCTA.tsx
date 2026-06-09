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
    <section className="w-full bg-[#fffaf3] py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div className="hidden lg:block lg:col-span-5">
            <div className="aspect-[4/3] rounded-3xl bg-[#f5efe8] relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-14 h-14 text-[#e0d4c8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <p className="absolute bottom-5 left-0 right-0 text-center text-xs font-semibold text-[#c4b8a8] tracking-widest uppercase">
                Image placeholder
              </p>
              <div className="absolute top-4 right-5 w-2 h-2 rounded-full bg-[#e8dbd0]" />
              <div className="absolute bottom-8 left-6 w-3 h-3 rounded-full bg-[#e8dbd0]" />
              <div className="absolute top-1/3 left-4 w-1.5 h-1.5 rounded-full bg-[#e8dbd0]" />
            </div>
          </div>

          <div className="lg:col-span-7 text-center lg:text-left">
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
      </div>
    </section>
  )
}

function subscribeToMount(onStoreChange: () => void) {
  onStoreChange()
  return () => {}
}

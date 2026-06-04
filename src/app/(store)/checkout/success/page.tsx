import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Order Confirmed',
}

export default function CheckoutSuccessPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-3">Order Confirmed!</h1>
      <p className="text-[#7a6247] mb-8">
        Thank you for your order. We&apos;ll send you a confirmation shortly.
      </p>
      <Link href="/shop-by-category" className="gather-btn-primary px-8 py-3.5">
        Continue Shopping
      </Link>
    </main>
  )
}

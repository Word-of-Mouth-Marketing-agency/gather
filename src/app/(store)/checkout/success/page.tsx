import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Order Placed' }

export default function OrderSuccessPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-5">🎉</div>
      <h1 className="text-3xl font-black text-[#171717]">Order Placed!</h1>
      <p className="mt-3 text-[#7a6247] text-base leading-relaxed">
        Thank you for your order. We&apos;re preparing your gift and will deliver it on your chosen date.
        You&apos;ll receive a confirmation shortly.
      </p>
      <Link href="/" className="inline-flex mt-8 gather-btn-primary px-8 py-3.5 text-base shadow-lg">
        Back to Home
      </Link>
    </main>
  )
}

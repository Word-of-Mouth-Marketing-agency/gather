import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Gather for orders, inquiries, or support.',
}

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-3">Contact Us</h1>
      <p className="text-[#7a6247] mb-10">We&apos;re here to help you create the perfect moment.</p>

      <div className="gather-section p-7 rounded-3xl space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ff7a1a]/10 flex items-center justify-center text-2xl">📍</div>
          <div>
            <p className="font-bold text-sm text-[#171717]">Delivery Areas</p>
            <p className="text-sm text-gray-500">Dokki, Mohandessin, Manial, Zamalek, Haram</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ff7a1a]/10 flex items-center justify-center text-2xl">⏰</div>
          <div>
            <p className="font-bold text-sm text-[#171717]">Working Hours</p>
            <p className="text-sm text-gray-500">Every day · 10:00 AM – 10:00 PM</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#ff7a1a]/10 flex items-center justify-center text-2xl">💬</div>
          <div>
            <p className="font-bold text-sm text-[#171717]">WhatsApp Support</p>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#ff7a1a] font-medium hover:underline"
            >
              Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/shop-by-category" className="gather-btn-primary px-8 py-3.5">
          Start Shopping
        </Link>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund and Returns Policy',
  description: 'Gather refund and returns policy.',
}

export default function RefundReturnsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-6">Refund and Returns Policy</h1>

      <div className="prose prose-stone max-w-none text-[#7a6247] space-y-4 text-sm leading-relaxed">
        <h2 className="text-lg font-bold text-[#171717]">Cancellation</h2>
        <p>
          Orders can be cancelled within 1 hour of placement. After that, the order may already be in preparation and cannot be cancelled.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">Returns</h2>
        <p>
          Due to the nature of our products (perishable goods, custom items), we do not accept returns unless the item arrives damaged or incorrect.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">Damaged or Incorrect Items</h2>
        <p>
          If your order arrives damaged or with incorrect items, please contact us within 24 hours of delivery at info@gather-eg.com with your order number and photos. We will arrange a replacement or refund.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">Refunds</h2>
        <p>
          Approved refunds will be processed within 5-7 business days to the original payment method.
        </p>

        <p className="text-xs text-gray-400 pt-4">
          For any questions, please <Link href="/contact" className="text-[#ff7a1a] hover:underline">contact us</Link>.
        </p>
      </div>
    </main>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'

export const metadata: Metadata = {
  title: 'Refund and Returns Policy',
  description: 'Gather refund and returns policy — order cancellation, returns, damaged items, and refunds.',
}

export default function RefundReturnsPage() {
  return (
    <>
      <PageTitleSection title="Refund and Returns Policy" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-[#7a6247] text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Order Cancellation</h2>
            <p>
              You may cancel your order within <strong>1 hour</strong> of placement for a full refund.
              After this window, the order may already be in preparation, packing, or out for delivery
              and cannot be cancelled.
            </p>
            <p className="mt-2">
              To request a cancellation, please contact us immediately at{' '}
              <Link href="tel:+20123456789" className="text-[#ff7a1a] hover:underline">+20123456789</Link>{' '}
              or email{' '}
              <Link href="mailto:info@gather-eg.com" className="text-[#ff7a1a] hover:underline">info@gather-eg.com</Link>{' '}
              with your order number.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Returns</h2>
            <p>
              Due to the nature of our products — which include perishable goods, food items, and
              custom celebration products — we generally do not accept returns unless the item
              arrives damaged, defective, or incorrect.
            </p>
            <p className="mt-2">
              Non-perishable, unopened items may be considered for return on a case-by-case basis
              within <strong>3 days</strong> of delivery. Please contact us before returning any item.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Damaged or Incorrect Items</h2>
            <p>
              If your order arrives damaged, defective, or with incorrect items, please follow these steps:
            </p>
            <ol className="list-decimal pl-5 mt-2 space-y-1">
              <li>Contact us within <strong>24 hours</strong> of delivery.</li>
              <li>Email <Link href="mailto:info@gather-eg.com" className="text-[#ff7a1a] hover:underline">info@gather-eg.com</Link> with your order number and clear photos of the damaged or incorrect items.</li>
              <li>Our team will review your request and respond within 1-2 business days.</li>
              <li>If approved, we will arrange a replacement or full refund, including any delivery charges.</li>
            </ol>
            <p className="mt-2">
              We may request that the damaged item be returned or provide instructions for disposal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Refunds</h2>
            <p>Once we receive and review your return request, we will notify you of the approval status.</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><strong>Approved refunds</strong> will be processed within <strong>5-7 business days</strong>.</li>
              <li>Refunds are issued to the <strong>original payment method</strong> used during checkout.</li>
              <li>For Cash on Delivery orders, refunds will be processed via bank transfer or as store credit (your choice).</li>
              <li>You will receive a confirmation email once the refund has been initiated.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Non-Returnable Items</h2>
            <p>The following items are not eligible for return or refund:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Perishable food and beverage items (unless damaged or incorrect).</li>
              <li>Custom-made or personalised celebration products.</li>
              <li>Items that have been opened, used, or tampered with.</li>
              <li>Items returned without prior approval.</li>
              <li>Orders where the cancellation window has passed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Late or Missing Refunds</h2>
            <p>
              If you have not received your refund within the stated time frame, please check your
              bank account or payment provider first. If the refund is still not visible after
              10 business days, contact us at{' '}
              <Link href="mailto:info@gather-eg.com" className="text-[#ff7a1a] hover:underline">info@gather-eg.com</Link>{' '}
              and we will investigate.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Delivery Issues</h2>
            <p>
              If your order has not arrived within the estimated delivery window, please check your
              order status in your account or contact our support team. We are not responsible for
              delays caused by unforeseen circumstances such as extreme weather, traffic conditions,
              or public holidays.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Exceptions</h2>
            <p>
              We reserve the right to make exceptions to this policy on a case-by-case basis.
              Any exceptions are made at the sole discretion of Gather management.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Contact Us</h2>
            <p>For any questions or concerns regarding our refund and returns policy:</p>
            <ul className="list-none mt-2 space-y-1">
              <li>Email: <Link href="mailto:info@gather-eg.com" className="text-[#ff7a1a] hover:underline">info@gather-eg.com</Link></li>
              <li>Phone: <Link href="tel:+20123456789" className="text-[#ff7a1a] hover:underline">+20123456789</Link></li>
              <li>Location: Cairo, Egypt</li>
            </ul>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-[#f1e2d3]">
            For any questions, please{' '}
            <Link href="/contact" className="text-[#ff7a1a] hover:underline">contact us</Link>.
          </p>
        </div>
      </main>
    </>
  )
}

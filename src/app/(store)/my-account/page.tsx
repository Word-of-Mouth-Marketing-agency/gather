import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Gather account.',
}

export default function MyAccountPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-2">My Account</h1>
      <p className="text-[#7a6247] mb-10">Manage your profile, orders, and preferences.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/wishlist"
          className="gather-card p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#ff7a1a]/10 flex items-center justify-center text-2xl mb-3">♥</div>
          <h3 className="font-bold text-[#171717]">Wishlist</h3>
          <p className="text-xs text-[#7a6247] mt-1">View and manage your saved items</p>
        </Link>

        <Link
          href="/cart"
          className="gather-card p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#ff7a1a]/10 flex items-center justify-center text-2xl mb-3">🛒</div>
          <h3 className="font-bold text-[#171717]">Cart</h3>
          <p className="text-xs text-[#7a6247] mt-1">View your cart and checkout</p>
        </Link>

        <Link
          href="/contact"
          className="gather-card p-6 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#ff7a1a]/10 flex items-center justify-center text-2xl mb-3">💬</div>
          <h3 className="font-bold text-[#171717]">Contact Us</h3>
          <p className="text-xs text-[#7a6247] mt-1">Get in touch with our team</p>
        </Link>
      </div>
    </main>
  )
}

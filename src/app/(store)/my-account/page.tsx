'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCustomerSession, clearCustomerSession } from '@/lib/customer-auth'
import PageTitleSection from '@/components/PageTitleSection'
import { useState, useEffect } from 'react'
import type { Order } from '@/lib/orders'
import SignInPrompt from '@/components/SignInPrompt'

export default function MyAccountPage() {
  const session = useCustomerSession()
  const router = useRouter()
  const [recentOrders, setRecentOrders] = useState<Order[]>([])

  useEffect(() => {
    if (!session) return
    fetch(`/api/orders?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => setRecentOrders(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {})
  }, [session])

  function handleLogout() {
    clearCustomerSession()
    router.push('/')
    router.refresh()
  }

  if (!session) return <SignInPrompt />

  const initials = session.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <PageTitleSection title="My Account" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[#ff7a1a] text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-black text-[#171717]">Welcome, {session.name.split(' ')[0]}!</h2>
            <p className="text-sm text-[#7a6247]">{session.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <DashboardCard href="/my-account/orders" icon="📦" label="Orders" desc="View your order history" />
          <DashboardCard href="/my-account/profile" icon="👤" label="Profile" desc="Edit your details" />
          <DashboardCard href="/my-account/addresses" icon="📍" label="Addresses" desc="Manage delivery addresses" />
          <DashboardCard href="/wishlist" icon="♥" label="Wishlist" desc="Your saved items" />
        </div>

        {recentOrders.length > 0 && (
          <section className="gather-section p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-[#171717]">Recent Orders</h3>
              <Link href="/my-account/orders" className="text-sm text-[#ff7a1a] font-semibold hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <span className="font-semibold text-[#171717]">{order.orderNumber}</span>
                    <span className="text-[#7a6247] ml-3">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={handleLogout}
            className="gather-btn-secondary text-sm"
          >
            Sign Out
          </button>
        </div>
      </main>
    </>
  )
}

function DashboardCard({ href, icon, label, desc }: { href: string; icon: string; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="gather-card p-5 rounded-2xl flex flex-col items-center text-center hover:-translate-y-1 transition-all"
    >
      <div className="w-11 h-11 rounded-full bg-[#ff7a1a]/10 flex items-center justify-center text-xl mb-2.5">
        {icon}
      </div>
      <h3 className="font-bold text-[#171717] text-sm">{label}</h3>
      <p className="text-[10px] text-[#7a6247] mt-0.5">{desc}</p>
    </Link>
  )
}

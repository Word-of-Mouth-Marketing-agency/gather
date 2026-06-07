'use client'

import { useState, useEffect } from 'react'
import { useCustomerSession } from '@/lib/customer-auth'
import PageTitleSection from '@/components/PageTitleSection'
import Link from 'next/link'
import SignInPrompt from '@/components/SignInPrompt'
import type { Order } from '@/lib/orders'

export default function OrdersPage() {
  const session = useCustomerSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    fetch(`/api/orders?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  if (!session) return <SignInPrompt />

  return (
    <>
      <PageTitleSection title="My Orders" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link href="/my-account" className="text-sm text-[#ff7a1a] font-semibold hover:underline">&larr; Back to Account</Link>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#7a6247]">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-xl font-black text-[#171717]">No orders yet</h2>
            <p className="text-sm text-[#7a6247] mt-2">Start shopping to see your orders here.</p>
            <Link href="/shop-by-category" className="inline-flex mt-4 gather-btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="gather-section p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-[#171717]">{order.orderNumber}</span>
                    <span className="text-sm text-[#7a6247] ml-3">{new Date(order.createdAt).toLocaleDateString()}</span>
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
                <div className="text-sm text-[#7a6247] space-y-1">
                  <p>Items: {order.items.length}</p>
                  <p>Total: {order.total.toLocaleString('en-EG')} {order.currency}</p>
                  <p>Delivery: {order.delivery.address}, {order.delivery.city} — {order.delivery.date} ({order.delivery.slot})</p>
                </div>
                {order.notes && (
                  <p className="mt-2 text-xs text-[#6b4b00] bg-[#fff7df] border border-[#f1d38a] rounded-lg px-3 py-2">
                    Notes: {order.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

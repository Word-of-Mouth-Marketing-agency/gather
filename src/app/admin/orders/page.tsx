'use client'

import { useState, useEffect } from 'react'

interface Order {
  id: string
  orderNumber: string
  customer: { firstName: string; lastName: string; email: string; phone: string }
  delivery: { city: string; address: string; date: string; slot: string }
  items: { name: string; price: number; quantity: number }[]
  total: number
  currency: string
  status: string
  createdAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) setOrders(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orders.length} total orders</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-bold text-gray-900">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">
                    {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  order.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                  order.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                  order.status === 'delivered' ? 'bg-green-50 text-green-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📅 {order.delivery.date} · {order.delivery.slot} · 📍 {order.delivery.city}</p>
                <p>📞 {order.customer.phone}</p>
                <p className="text-xs text-gray-400">{order.items.length} item(s) · Total: {order.total} {order.currency}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

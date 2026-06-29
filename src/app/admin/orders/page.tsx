'use client'

import { startTransition, useEffect, useMemo, useState } from 'react'
import type { Order, OrderStatus } from '@/lib/orders'

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusClasses: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-blue-50 text-blue-700',
  preparing: 'bg-orange-50 text-orange-700',
  out_for_delivery: 'bg-purple-50 text-purple-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

function statusLabel(status: string) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

function formatMoney(amount: number | undefined, currency = 'EGP') {
  return `${Number(amount ?? 0).toLocaleString('en-EG')} ${currency}`
}

function customerName(order: Order) {
  return `${order.customer.firstName} ${order.customer.lastName}`.trim() || order.customer.email
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [selected, setSelected] = useState<Order | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders')
      if (res.ok) setOrders(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { loadOrders() }) }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesSearch = !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.id.toLowerCase().includes(q) ||
        customerName(order).toLowerCase().includes(q) ||
        order.customer.email.toLowerCase().includes(q) ||
        order.customer.phone.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [orders, search, statusFilter])

  async function updateStatus(order: Order, status: OrderStatus) {
    setSavingId(order.id)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)))
        setSelected((current) => (current?.id === updated.id ? updated : current))
      }
    } catch { /* ignore */ }
    setSavingId(null)
  }

  async function deleteOrder(order: Order) {
    if (deleting !== order.id) {
      setDeleting(order.id)
      window.setTimeout(() => setDeleting(null), 3000)
      return
    }

    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      if (res.ok) {
        setOrders((current) => current.filter((item) => item.id !== order.id))
        setSelected((current) => (current?.id === order.id ? null : current))
      }
    } catch { /* ignore */ }
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Orders</h1>
        <p className="text-sm text-gray-400 mt-0.5">{orders.length} total order(s)</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by order, customer, email, or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm focus:border-[#ff7a1a] focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'all' | OrderStatus)}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 focus:border-[#ff7a1a] focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/20"
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-gray-400">{orders.length ? 'No orders match your filters.' : 'No orders yet.'}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400">Order</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400 md:table-cell">Customer</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400 lg:table-cell">Delivery</th>
                <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400">Total</th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-400 sm:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <button onClick={() => setSelected(order)} className="text-left">
                      <p className="font-bold text-gray-900 hover:text-[#ff7a1a]">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </button>
                  </td>
                  <td className="hidden px-5 py-4 md:table-cell">
                    <p className="font-semibold text-gray-700">{customerName(order)}</p>
                    <p className="text-xs text-gray-400">{order.customer.email}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-gray-500 lg:table-cell">
                    <p>{order.delivery.date || '-'}</p>
                    <p className="text-xs text-gray-400">{order.delivery.city || '-'} - {order.delivery.slot || '-'}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-gray-900">{formatMoney(order.total, order.currency)}</td>
                  <td className="hidden px-5 py-4 sm:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusClasses[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelected(order)} className="text-xs font-semibold text-[#ff7a1a] hover:underline">View</button>
                      <button
                        onClick={() => deleteOrder(order)}
                        className={`text-xs font-semibold transition-colors ${
                          deleting === order.id ? 'rounded bg-red-500 px-2 py-0.5 text-white' : 'text-red-400 hover:text-red-500'
                        }`}
                      >
                        {deleting === order.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <OrderDetailsModal
          order={selected}
          saving={savingId === selected.id}
          deleting={deleting === selected.id}
          onClose={() => setSelected(null)}
          onStatusChange={(status) => updateStatus(selected, status)}
          onDelete={() => deleteOrder(selected)}
        />
      )}
    </div>
  )
}

function OrderDetailsModal({
  order,
  saving,
  deleting,
  onClose,
  onStatusChange,
  onDelete,
}: {
  order: Order
  saving: boolean
  deleting: boolean
  onClose: () => void
  onStatusChange: (status: OrderStatus) => void
  onDelete: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900">{order.orderNumber}</h2>
            <p className="text-xs text-gray-400">
              Created {new Date(order.createdAt).toLocaleString()}
              {order.updatedAt ? ` - Updated ${new Date(order.updatedAt).toLocaleString()}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200">
            &times;
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Order status</span>
            <select
              value={order.status}
              disabled={saving}
              onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold focus:border-[#ff7a1a] focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/20 disabled:opacity-60"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button
            onClick={onDelete}
            className={`self-end rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              deleting ? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-50'
            }`}
          >
            {deleting ? 'Confirm delete?' : 'Delete order'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <InfoPanel title="Customer">
            <p className="font-bold text-gray-900">{customerName(order)}</p>
            <p>{order.customer.email}</p>
            <p>{order.customer.phone}</p>
          </InfoPanel>

          <InfoPanel title="Delivery">
            <p>{order.delivery.address || '-'}</p>
            <p>{order.delivery.city || '-'}</p>
            <p>{order.delivery.date || '-'} ({order.delivery.slot || '-'})</p>
          </InfoPanel>

          <InfoPanel title="Payment">
            <p>Method: {order.paymentMethod || '-'}</p>
            <p>Status: {statusLabel(order.status)}</p>
            <p>Currency: {order.currency}</p>
          </InfoPanel>
        </div>

        <div className="mt-5 rounded-2xl border border-gray-100">
          <div className="border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-black text-gray-900">Items</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {order.items.map((item, index) => (
              <div key={`${item.type}-${index}`} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">
                    {item.type === 'bundle' ? 'Bundle' : 'Product'} - Qty {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatMoney(item.price * item.quantity, order.currency)}</p>
                  <p className="text-xs text-gray-400">{formatMoney(item.price, order.currency)} each</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <InfoPanel title="Notes and consent">
            <p>Notes: {order.notes || 'No notes.'}</p>
            <p>Privacy policy: {order.acceptedPrivacyPolicy ? 'Accepted' : 'Not accepted'}</p>
            <p>Refund policy: {order.acceptedRefundPolicy ? 'Accepted' : 'Not accepted'}</p>
            <p>Accepted at: {order.acceptedPoliciesAt ? new Date(order.acceptedPoliciesAt).toLocaleString() : '-'}</p>
          </InfoPanel>

          <InfoPanel title="Totals">
            <div className="space-y-2">
              <TotalRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
              <TotalRow label="Shipping" value={formatMoney(order.shippingFee ?? order.delivery.shippingFee, order.currency)} />
              <TotalRow label="Total" value={formatMoney(order.total, order.currency)} strong />
            </div>
          </InfoPanel>
        </div>
      </div>
    </div>
  )
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-100 p-4 text-sm text-gray-600">
      <h3 className="mb-3 text-xs font-black uppercase tracking-wide text-gray-400">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${strong ? 'border-t border-gray-100 pt-2 text-base font-black text-gray-900' : 'text-sm text-gray-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

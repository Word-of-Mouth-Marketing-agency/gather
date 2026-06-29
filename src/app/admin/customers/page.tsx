'use client'

import { startTransition, useEffect, useMemo, useState } from 'react'

interface Address {
  id: string
  label: string
  city: string
  street: string
  apartment?: string
  phone: string
  isDefault: boolean
}

interface CustomerRecord {
  id: string
  name: string
  email: string
  phone: string
  addresses: Address[]
  isActive?: boolean
  status?: 'active' | 'disabled'
  createdAt: string
}

interface OrderRecord {
  id: string
  orderNumber: string
  total: number
  currency: string
  status: string
  createdAt: string
}

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  status: 'active' as 'active' | 'disabled',
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<CustomerRecord | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/admin/customers')
      if (res.ok) setCustomers(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(q) ||
      customer.email.toLowerCase().includes(q) ||
      customer.phone.toLowerCase().includes(q)
    )
  }, [customers, search])

  function isActive(customer: CustomerRecord) {
    return customer.isActive !== false && customer.status !== 'disabled'
  }

  async function openCustomer(customer: CustomerRecord) {
    setSelected(customer)
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      status: isActive(customer) ? 'active' : 'disabled',
    })
    setOrders([])
    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(customer.email)}`)
      if (res.ok) setOrders(await res.json())
    } catch { /* ignore */ }
  }

  function closeModal() {
    setSelected(null)
    setOrders([])
    setForm(emptyForm)
  }

  async function saveCustomer() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          isActive: form.status === 'active',
          status: form.status,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setSelected(updated)
        await load()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function toggleStatus(customer: CustomerRecord) {
    try {
      await fetch(`/api/admin/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          isActive: !isActive(customer),
          status: isActive(customer) ? 'disabled' : 'active',
        }),
      })
      await load()
    } catch { /* ignore */ }
  }

  async function deleteCustomer(id: string) {
    if (deleting === id) {
      try {
        await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
        setDeleting(null)
        closeModal()
        await load()
      } catch { /* ignore */ }
    } else {
      setDeleting(id)
      window.setTimeout(() => setDeleting(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} registered customer(s)</p>
        </div>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <button onClick={() => openCustomer(customer)} className="text-left">
                      <p className="font-semibold text-gray-900 hover:text-[#ff7a1a]">{customer.name}</p>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </button>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-gray-500">{customer.phone || '-'}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-500">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <button
                      onClick={() => toggleStatus(customer)}
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        isActive(customer) ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isActive(customer) ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openCustomer(customer)} className="text-xs text-[#ff7a1a] hover:underline font-semibold">View</button>
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className={`text-xs font-semibold transition-colors ${
                          deleting === customer.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                        }`}
                      >
                        {deleting === customer.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {search ? 'No customers match your search.' : 'No customers yet.'}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-400">{selected.email}</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Email">
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Phone">
                <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'active' | 'disabled' }))} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </Field>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 p-4">
                <h3 className="text-sm font-black text-gray-900 mb-3">Addresses</h3>
                {selected.addresses?.length ? (
                  <div className="space-y-2">
                    {selected.addresses.map((address) => (
                      <div key={address.id} className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <p className="font-bold text-gray-800">{address.label}{address.isDefault ? ' - Default' : ''}</p>
                        <p>{address.street}{address.apartment ? `, ${address.apartment}` : ''}</p>
                        <p>{address.city} - {address.phone}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No addresses saved.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 p-4">
                <h3 className="text-sm font-black text-gray-900 mb-3">Orders</h3>
                {orders.length ? (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <p className="font-bold text-gray-800">{order.orderNumber}</p>
                        <p>{order.total.toLocaleString('en-EG')} {order.currency} - {order.status}</p>
                        <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No orders yet.</p>
                )}
              </div>
            </div>

            <div className="flex justify-between gap-3 mt-7 pt-4 border-t border-gray-100">
              <button
                onClick={() => deleteCustomer(selected.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  deleting === selected.id ? 'text-white bg-red-500' : 'text-red-400 hover:bg-red-50'
                }`}
              >
                {deleting === selected.id ? 'Confirm delete?' : 'Delete'}
              </button>
              <div className="flex gap-3">
                <button onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={saveCustomer} disabled={saving} className="gather-btn-primary text-sm py-2.5 px-6 shadow-md disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  )
}

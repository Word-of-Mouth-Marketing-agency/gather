'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import Link from 'next/link'
import type { Coupon } from '@/types'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'expired' | 'scheduled'>('all')

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/coupons')
    if (res.ok) setCoupons(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { startTransition(() => { load() }) }, [load])

  async function toggleActive(coupon: Coupon) {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !coupon.isActive }),
    })
    load()
  }

  async function handleDelete(id: string) {
    if (deleting === id) {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
      setDeleting(null)
      load()
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  const [now] = useState(() => Date.now())

  const filtered = coupons.filter((c) => {
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false
    switch (filter) {
      case 'active': return c.isActive && (!c.expiresAt || new Date(c.expiresAt).getTime() > now) && (!c.startsAt || new Date(c.startsAt).getTime() <= now)
      case 'inactive': return !c.isActive
      case 'expired': return !!c.expiresAt && new Date(c.expiresAt).getTime() < now
      case 'scheduled': return !!c.startsAt && new Date(c.startsAt).getTime() > now
      default: return true
    }
  })

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Coupons</h1>
        <Link href="/admin/coupons/new" className="gather-btn-primary text-sm py-2.5 px-5">
          New Coupon
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        <input type="text" placeholder="Search by code..." value={search} onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} max-w-xs`} />
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}
          className={`${inputCls} max-w-[160px]`}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading coupons...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {coupons.length === 0 ? 'No coupons yet. Create your first coupon!' : 'No coupons match your filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">Code</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Type</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Value</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Usage</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Start</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Expires</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Min</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c) => {
                const isExpired = c.expiresAt && new Date(c.expiresAt).getTime() < now
                const isScheduled = c.startsAt && new Date(c.startsAt).getTime() > now
                const statusText = !c.isActive ? 'Inactive' : isExpired ? 'Expired' : isScheduled ? 'Scheduled' : 'Active'
                const statusColor = !c.isActive ? 'text-gray-400' : isExpired ? 'text-red-500' : isScheduled ? 'text-amber-500' : 'text-green-600'
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3"><span className="font-bold text-[#171717]">{c.code}</span></td>
                    <td className="px-5 py-3 text-gray-600">{c.discountType === 'percentage' ? '%' : 'EGP'}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue} EGP`}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.startsAt ? new Date(c.startsAt).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{c.minimumOrderAmount ? `${c.minimumOrderAmount}` : '-'}</td>
                    <td className={`px-5 py-3 font-semibold text-xs ${statusColor}`}>{statusText}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleActive(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors">
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <Link href={`/admin/coupons/${c.id}/edit`}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#fff4e8] text-[#ff7a1a] hover:bg-[#ffede0] transition-colors">
                          Edit
                        </Link>
                        <button onClick={() => handleDelete(c.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            deleting === c.id
                              ? 'bg-red-600 text-white'
                              : 'bg-red-50 text-red-500 hover:bg-red-100'
                          }`}>
                          {deleting === c.id ? 'Confirm' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

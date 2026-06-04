'use client'

import { useState, useEffect } from 'react'
import type { Bundle } from '@/types'

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/bundles')
        if (res.ok) setBundles(await res.json())
      } catch { /* ignore */ }
    }
    load()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Bundles</h1>
        <p className="text-sm text-gray-400 mt-0.5">{bundles.length} total bundles</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Bundle</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Regular</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Offer</th>
              <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Products</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bundles.map((bundle) => (
              <tr key={bundle.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{bundle.name}</p>
                    <p className="text-xs text-gray-400">{bundle.badge}</p>
                  </div>
                </td>
                <td className="px-5 py-3 hidden md:table-cell text-gray-500">{bundle.regularPrice} {bundle.currency}</td>
                <td className="px-5 py-3 hidden md:table-cell font-bold text-[#ff7a1a]">{bundle.offerPrice} {bundle.currency}</td>
                <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-400">
                  {bundle.productIds.length} products
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bundles.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No bundles yet.</div>
        )}
      </div>
    </div>
  )
}

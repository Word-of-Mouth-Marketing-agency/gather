'use client'

import { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Bundle } from '@/types'
import { getAllProducts } from '@/lib/data'
import { getBundleStatus } from '@/lib/scheduled-discounts'

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/bundles')
      if (res.ok) setBundles(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  async function handleDelete(id: string) {
    if (deleting === id) {
      try {
        await fetch(`/api/bundles/${id}`, { method: 'DELETE' })
        setDeleting(null)
        await load()
      } catch { /* ignore */ }
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  const products = getAllProducts()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Bundles</h1>
          <p className="text-sm text-gray-400 mt-0.5">{bundles.length} total bundles</p>
        </div>
        <Link href="/admin/bundles/new" className="gather-btn-primary text-sm py-2.5 px-5 shadow-md inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Bundle
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Bundle</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Badge</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Price</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Products</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bundles.map((bundle) => {
                const uniqueIds = [...new Set(bundle.productIds)]
                const bundleProducts = uniqueIds.map((id) => products.find((p) => p.id === id)).filter(Boolean) as NonNullable<ReturnType<typeof products.find>>[]
                const status = getBundleStatus(bundle)
                return (
                  <tr key={bundle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <Link href={`/admin/bundles/${bundle.id}/edit`} className="font-semibold text-gray-900 hover:text-[#ff7a1a] transition-colors">
                          {bundle.name}
                        </Link>
                        <p className="text-xs text-gray-400">/{bundle.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {bundle.badge ? (
                        <span className="text-xs bg-[#fff4e8] text-[#ff7a1a] font-bold px-2 py-1 rounded-full">
                          {bundle.badge}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="font-bold text-[#ff7a1a]">{bundle.offerPrice} {bundle.currency}</span>
                      {!!bundle.regularPrice && (
                        <span className="ml-1.5 text-xs text-gray-400 line-through">{bundle.regularPrice!} {bundle.currency}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-2">
                          {bundleProducts.slice(0, 4).map((p) => (
                            <div key={p.id} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                              {p.images[0] ? (
                                <Image src={p.images[0]} alt="" width={28} height={28} className="object-cover w-full h-full" />
                              ) : (
                                <span className="flex items-center justify-center text-xs h-full">🎁</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-400 ml-1">{bundleProducts.length} products</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        status === 'Active' ? 'bg-green-50 text-green-600' :
                        status === 'Scheduled' ? 'bg-blue-50 text-blue-600' :
                        status === 'Expired' ? 'bg-orange-50 text-orange-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/admin/bundles/${bundle.id}/edit`}
                          className="text-xs text-[#ff7a1a] hover:underline font-semibold"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(bundle.id)}
                          className={`text-xs font-semibold transition-colors ${
                            deleting === bundle.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                          }`}
                        >
                          {deleting === bundle.id ? 'Confirm?' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {bundles.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              <p>No bundles yet.</p>
              <Link href="/admin/bundles/new" className="inline-block mt-3 text-[#ff7a1a] font-bold hover:underline text-sm">
                Create your first bundle →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

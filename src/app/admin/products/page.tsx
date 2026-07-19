'use client'

import { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types'
import { getActiveProductPrice, isProductDiscountActive } from '@/lib/scheduled-discounts'

type Role = 'super_admin' | 'marketing_admin' | 'finance_admin'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [role, setRole] = useState<Role | null>(null)

  async function load() {
    try {
      const [res, meRes] = await Promise.all([
        fetch('/api/products?includeArchived=true'),
        fetch('/api/auth/me'),
      ])
      if (res.ok) setProducts(await res.json())
      if (meRes.ok) {
        const data = await meRes.json()
        if (data.authenticated) setRole(data.role)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.includes(search.toLowerCase())
  )

  const isSuper = role === 'super_admin'
  const isMarketing = role === 'marketing_admin'
  const isFinance = role === 'finance_admin'

  async function handleDelete(id: string) {
    if (deleting === id) {
      try {
        setDeleteError(null)
        setDeleteWarning(null)
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
        const body = await res.json().catch(() => ({})) as Record<string, unknown>
        if (!res.ok) {
          setDeleteError((body.error as string) || `Delete failed (${res.status})`)
          setDeleting(null)
          return
        }
        if (body.warning) setDeleteWarning(body.warning as string)
        setDeleting(null)
        await load()
      } catch {
        setDeleteError('Network error — product may not have been deleted')
        setDeleting(null)
      }
    } else {
      setDeleting(id)
      setDeleteError(null)
      setDeleteWarning(null)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-3">
          {role !== 'finance_admin' && (
            <Link href="/admin/products/new" className="gather-btn-primary text-sm py-2.5 px-5 shadow-md inline-flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Product
            </Link>
          )}
        </div>
      </div>

      <div className="relative">
        {deleteError && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2.5 flex items-center justify-between">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600 ml-2 font-bold">&times;</button>
          </div>
        )}
        {deleteWarning && (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-2.5 flex items-center justify-between">
            <span>{deleteWarning}</span>
            <button onClick={() => setDeleteWarning(null)} className="text-amber-500 hover:text-amber-700 ml-2 font-bold">&times;</button>
          </div>
        )}
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search products..."
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
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Product</th>
                {!isMarketing && <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Price</th>}
                {(isSuper || isFinance) && <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Stock</th>}
                {!isFinance && <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Featured</th>}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((product) => {
                const activeDiscount = isProductDiscountActive(product)
                const activePrice = getActiveProductPrice(product)
                return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#f8f8f8] flex items-center justify-center text-xl shrink-0 overflow-hidden">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <span>🎁</span>
                        )}
                      </div>
                      <div>
                        <Link href={`/admin/products/${product.id}/edit`} className="font-semibold text-gray-900 hover:text-[#ff7a1a] transition-colors">
                          {product.name}
                        </Link>
                        <p className="text-xs text-gray-400">/{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  {!isMarketing && (
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="font-bold text-[#ff7a1a]">{activePrice} {product.currency}</span>
                      {activeDiscount && (
                        <span className="ml-2 text-xs text-gray-400 line-through">{product.price} {product.currency}</span>
                      )}
                    </td>
                  )}
                  {(isSuper || isFinance) && (
                    <td className="px-5 py-3 hidden lg:table-cell">
                      <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock <= 3 ? 'text-orange-500' : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                  )}
                  {!isFinance && (
                    <td className="px-5 py-3 hidden lg:table-cell">
                      {product.featured ? (
                        <span className="text-xs bg-[#fff4e8] text-[#ff7a1a] font-bold px-2 py-1 rounded-full">Yes</span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs text-[#ff7a1a] hover:underline font-semibold"
                      >
                        Edit
                      </Link>
                      {isSuper && (
                        <button
                          onClick={() => handleDelete(product.id)}
                          className={`text-xs font-semibold transition-colors ${
                            deleting === product.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                          }`}
                        >
                          {deleting === product.id ? 'Confirm?' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {search ? 'No products match your search.' : (
                <div>
                  <p>No products yet.</p>
                  <Link href="/admin/products/new" className="inline-block mt-3 text-[#ff7a1a] font-bold hover:underline text-sm">
                    Create your first product →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

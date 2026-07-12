'use client'

import { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/types'
import { getActiveProductPrice, isProductDiscountActive } from '@/lib/scheduled-discounts'

interface SyncResult {
  total: number
  withSku: number
  created: number
  updated: number
  skippedMissingSku: number
  failed: number
  missingCategoryMapping: number
  warnings: string[]
  errors: Record<string, string>
}

interface StockSyncResult {
  total: number
  withSku: number
  updated: number
  skippedMissingSku: number
  failed: number
  warnings: string[]
  errors: Record<string, string>
  timestamp: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [stockSyncing, setStockSyncing] = useState(false)
  const [stockSyncResult, setStockSyncResult] = useState<StockSyncResult | null>(null)
  const [pullSyncing, setPullSyncing] = useState(false)
  const [pullResult, setPullResult] = useState<StockSyncResult | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/products?includeArchived=true')
      if (res.ok) setProducts(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.includes(search.toLowerCase())
  )

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

  async function handleSyncOdoo() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/products/sync-odoo', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSyncResult(data)
        await load()
      } else {
        const err = await res.json()
        setSyncResult({
          total: 0, withSku: 0, created: 0, updated: 0, skippedMissingSku: 0, failed: 0,
          missingCategoryMapping: 0,
          warnings: [err.error ?? 'Sync request failed'],
          errors: {},
        })
      }
    } catch {
      setSyncResult({
        total: 0, withSku: 0, created: 0, updated: 0, skippedMissingSku: 0, failed: 0,
        missingCategoryMapping: 0,
        warnings: ['Network error — could not reach the sync endpoint'],
        errors: {},
      })
    }
    setSyncing(false)
  }

  async function handleSyncStock() {
    setStockSyncing(true)
    setStockSyncResult(null)
    try {
      const res = await fetch('/api/admin/products/sync-stock-odoo', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStockSyncResult(data)
        await load()
      } else {
        const err = await res.json()
        setStockSyncResult({
          total: 0, withSku: 0, updated: 0, skippedMissingSku: 0, failed: 0,
          warnings: [err.error ?? 'Stock sync request failed'],
          errors: {},
          timestamp: new Date().toISOString(),
        })
      }
    } catch {
      setStockSyncResult({
        total: 0, withSku: 0, updated: 0, skippedMissingSku: 0, failed: 0,
        warnings: ['Network error — could not reach the stock sync endpoint'],
        errors: {},
        timestamp: new Date().toISOString(),
      })
    }
    setStockSyncing(false)
  }

  async function handlePullOdoo() {
    setPullSyncing(true)
    setPullResult(null)
    try {
      const res = await fetch('/api/admin/products/pull-odoo', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setPullResult(data)
        await load()
      } else {
        const err = await res.json()
        setPullResult({
          total: 0, withSku: 0, updated: 0, skippedMissingSku: 0, failed: 0,
          warnings: [err.error ?? 'Pull request failed'],
          errors: {},
          timestamp: new Date().toISOString(),
        })
      }
    } catch {
      setPullResult({
        total: 0, withSku: 0, updated: 0, skippedMissingSku: 0, failed: 0,
        warnings: ['Network error — could not reach the pull endpoint'],
        errors: {},
        timestamp: new Date().toISOString(),
      })
    }
    setPullSyncing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{products.length} total products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncOdoo}
            disabled={syncing}
            className="text-sm py-2.5 px-5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync Products to Odoo'}
          </button>
          <button
            onClick={handleSyncStock}
            disabled={stockSyncing}
            className="text-sm py-2.5 px-5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {stockSyncing ? 'Pulling stock...' : 'Sync Stock from Odoo'}
          </button>
          <button
            onClick={handlePullOdoo}
            disabled={pullSyncing}
            className="text-sm py-2.5 px-5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {pullSyncing ? 'Pulling...' : 'Pull Products from Odoo'}
          </button>
          <Link href="/admin/products/new" className="gather-btn-primary text-sm py-2.5 px-5 shadow-md inline-flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Product
          </Link>
        </div>
      </div>

      {syncResult && (
        <div className={`rounded-2xl border p-4 text-sm ${
          syncResult.failed > 0 || syncResult.missingCategoryMapping > 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : syncResult.warnings.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-gray-500">
              {syncResult.total} total, {syncResult.withSku} with SKU
            </span>
            {syncResult.created > 0 && <span>Created: <strong>{syncResult.created}</strong></span>}
            {syncResult.updated > 0 && <span>Updated: <strong>{syncResult.updated}</strong></span>}
            {syncResult.skippedMissingSku > 0 && <span>Skipped (no SKU): <strong>{syncResult.skippedMissingSku}</strong></span>}
            {syncResult.missingCategoryMapping > 0 && <span>Missing category: <strong className="text-red-600">{syncResult.missingCategoryMapping}</strong></span>}
            {syncResult.failed > 0 && <span>Failed: <strong className="text-red-600">{syncResult.failed}</strong></span>}
            {syncResult.total > 0 && syncResult.withSku === 0 && (
              <span>No products with SKU — add SKUs before syncing.</span>
            )}
            {syncResult.total === 0 && (
              <span>No products to sync.</span>
            )}
          </div>
          {syncResult.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {syncResult.warnings.map((w, i) => <li key={i} className="text-xs opacity-80">{w}</li>)}
            </ul>
          )}
          {Object.keys(syncResult.errors).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold cursor-pointer">Error details</summary>
              <ul className="mt-1 space-y-1">
                {Object.entries(syncResult.errors).map(([id, msg]) => (
                  <li key={id} className="text-xs opacity-80">{id}: {msg}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {stockSyncResult && (
        <div className={`rounded-2xl border p-4 text-sm ${
          stockSyncResult.failed > 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : stockSyncResult.warnings.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-gray-500">
              {stockSyncResult.total} total, {stockSyncResult.withSku} with SKU
            </span>
            {stockSyncResult.updated > 0 && <span>Updated: <strong>{stockSyncResult.updated}</strong></span>}
            {stockSyncResult.skippedMissingSku > 0 && <span>Skipped (no SKU): <strong>{stockSyncResult.skippedMissingSku}</strong></span>}
            {stockSyncResult.failed > 0 && <span>Failed: <strong className="text-red-600">{stockSyncResult.failed}</strong></span>}
            {stockSyncResult.total > 0 && stockSyncResult.withSku === 0 && (
              <span>No products with SKU — stock sync requires SKUs.</span>
            )}
            {stockSyncResult.total === 0 && (
              <span>No products to sync stock for.</span>
            )}
          </div>
          {stockSyncResult.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {stockSyncResult.warnings.map((w, i) => <li key={i} className="text-xs opacity-80">{w}</li>)}
            </ul>
          )}
          {Object.keys(stockSyncResult.errors).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold cursor-pointer">Error details</summary>
              <ul className="mt-1 space-y-1">
                {Object.entries(stockSyncResult.errors).map(([id, msg]) => (
                  <li key={id} className="text-xs opacity-80">{id}: {msg}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {pullResult && (
        <div className={`rounded-2xl border p-4 text-sm ${
          pullResult.failed > 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : pullResult.warnings.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-xs text-gray-500">
              {pullResult.total} total, {pullResult.withSku} with SKU
            </span>
            {pullResult.updated > 0 && <span>Updated: <strong>{pullResult.updated}</strong></span>}
            {pullResult.skippedMissingSku > 0 && <span>Skipped (no SKU): <strong>{pullResult.skippedMissingSku}</strong></span>}
            {pullResult.failed > 0 && <span>Failed: <strong className="text-red-600">{pullResult.failed}</strong></span>}
            {pullResult.total > 0 && pullResult.withSku === 0 && (
              <span>No products with SKU — pull requires SKUs.</span>
            )}
            {pullResult.total === 0 && (
              <span>No products to pull.</span>
            )}
          </div>
          {pullResult.warnings.length > 0 && (
            <ul className="mt-2 space-y-1">
              {pullResult.warnings.map((w, i) => <li key={i} className="text-xs opacity-80">{w}</li>)}
            </ul>
          )}
          {Object.keys(pullResult.errors).length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold cursor-pointer">Error details</summary>
              <ul className="mt-1 space-y-1">
                {Object.entries(pullResult.errors).map(([id, msg]) => (
                  <li key={id} className="text-xs opacity-80">{id}: {msg}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

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
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Price</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Featured</th>
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
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="font-bold text-[#ff7a1a]">{activePrice} {product.currency}</span>
                    {activeDiscount && (
                      <span className="ml-2 text-xs text-gray-400 line-through">{product.price} {product.currency}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className={`font-semibold ${product.stock === 0 ? 'text-red-500' : product.stock <= 3 ? 'text-orange-500' : 'text-green-600'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {product.featured ? (
                      <span className="text-xs bg-[#fff4e8] text-[#ff7a1a] font-bold px-2 py-1 rounded-full">Yes</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs text-[#ff7a1a] hover:underline font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className={`text-xs font-semibold transition-colors ${
                          deleting === product.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                        }`}
                      >
                        {deleting === product.id ? 'Confirm?' : 'Delete'}
                      </button>
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

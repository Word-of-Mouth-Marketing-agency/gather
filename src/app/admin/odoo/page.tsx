'use client'

import { useState, useEffect, startTransition } from 'react'

interface Diagnostics {
  connection: { ok: boolean; url: string | null; db: string | null; error?: string; uid?: number }
  requiredFields: {
    allOk: boolean
    models: Record<string, { allOk: boolean; fields: Array<{ field: string; exists: boolean }> }>
  }
  categories: { total: number; synced: number; failed: number; skippedOccasions: number }
  products: { total: number; withSku: number; synced: number; failed: number; missingSku: number; outOfStock: number }
  orders: { total: number; synced: number; failed: number; notSynced: number }
  stock: { lastStockPulledAt: string | null; outOfStockProducts: Array<{ id: string; name: string; sku: string; stock: number }> }
  timestamps: { categoryLastSyncedAt: string | null; productLastSyncedAt: string | null; stockLastPulledAt: string | null; orderLastSyncedAt: string | null }
  warnings: string[]
}

function Card({ title, children, ok }: { title: string; children: React.ReactNode; ok?: boolean }) {
  const border = ok === undefined ? 'border-gray-100' : ok ? 'border-green-200' : 'border-red-200'
  const badge = ok === undefined ? '' : ok ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'
  return (
    <div className={`rounded-2xl border ${border} bg-white p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">{title}</h2>
        {ok !== undefined && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{ok ? 'OK' : 'ISSUE'}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function CountRow({ label, count, highlight }: { label: string; count: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${highlight && count > 0 ? 'text-red-600' : 'text-gray-900'}`}>{count}</span>
    </div>
  )
}

function tsDisplay(ts: string | null) {
  if (!ts) return 'Never'
  const d = new Date(ts)
  return d.toLocaleString()
}

export default function OdooDiagnosticsPage() {
  const [data, setData] = useState<Diagnostics | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const res = await fetch('/api/admin/odoo/status')
      if (res.ok) setData(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  if (loading) return <p className="text-sm text-gray-400">Loading diagnostics...</p>
  if (!data) return <p className="text-sm text-red-500">Failed to load diagnostics.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Odoo Diagnostics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Sync status and system health</p>
        </div>
        <button onClick={() => { setLoading(true); load() }} className="text-sm py-2 px-4 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {data.warnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800 mb-1">Warnings</p>
          <ul className="space-y-1">
            {data.warnings.map((w, i) => <li key={i} className="text-xs text-amber-700">{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Connection" ok={data.connection.ok}>
          {data.connection.ok ? (
            <>
              <p className="text-sm text-gray-700">Connected as UID {data.connection.uid}</p>
              <p className="text-xs text-gray-400 mt-1">{data.connection.url} / {data.connection.db}</p>
            </>
          ) : (
            <p className="text-sm text-red-600">{data.connection.error}</p>
          )}
        </Card>

        <Card title="Required Fields" ok={data.requiredFields.allOk}>
          {Object.entries(data.requiredFields.models).map(([model, m]) => (
            <div key={model} className="mb-2 last:mb-0">
              <p className="text-xs font-bold text-gray-500 mb-1">{model}</p>
              {m.fields.map((f) => (
                <div key={f.field} className="flex items-center gap-2 text-xs">
                  <span className={f.exists ? 'text-green-600' : 'text-red-500'}>{f.exists ? '✓' : '✗'}</span>
                  <span className={f.exists ? 'text-gray-700' : 'text-red-600'}>{f.field}</span>
                </div>
              ))}
            </div>
          ))}
        </Card>

        <Card title="Categories">
          <CountRow label="Total" count={data.categories.total} />
          <CountRow label="Synced" count={data.categories.synced} />
          <CountRow label="Failed" count={data.categories.failed} highlight />
          <CountRow label="Skipped (occasions)" count={data.categories.skippedOccasions} />
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Last sync: {tsDisplay(data.timestamps.categoryLastSyncedAt)}</p>
            <a href="/admin/categories" className="text-xs text-[#ff7a1a] font-semibold hover:underline">Sync Categories →</a>
          </div>
        </Card>

        <Card title="Products">
          <CountRow label="Total" count={data.products.total} />
          <CountRow label="With SKU" count={data.products.withSku} />
          <CountRow label="Synced" count={data.products.synced} />
          <CountRow label="Failed" count={data.products.failed} highlight />
          <CountRow label="Missing SKU" count={data.products.missingSku} />
          <CountRow label="Out of stock" count={data.products.outOfStock} highlight={data.products.outOfStock > 0} />
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Last sync: {tsDisplay(data.timestamps.productLastSyncedAt)}</p>
            <a href="/admin/products" className="text-xs text-[#ff7a1a] font-semibold hover:underline">Sync Products →</a>
          </div>
        </Card>

        <Card title="Stock">
          <CountRow label="Out of stock" count={data.stock.outOfStockProducts.length} highlight={data.stock.outOfStockProducts.length > 0} />
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Last pulled: {tsDisplay(data.stock.lastStockPulledAt)}</p>
            <a href="/admin/products" className="text-xs text-[#ff7a1a] font-semibold hover:underline">Pull Stock →</a>
          </div>
          {data.stock.outOfStockProducts.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs font-semibold cursor-pointer text-gray-500">Out of stock products</summary>
              <ul className="mt-1 space-y-1">
                {data.stock.outOfStockProducts.map((p) => (
                  <li key={p.id} className="text-xs text-gray-500">{p.name} (SKU: {p.sku}, stock: {p.stock})</li>
                ))}
              </ul>
            </details>
          )}
        </Card>

        <Card title="Orders">
          <CountRow label="Total" count={data.orders.total} />
          <CountRow label="Synced" count={data.orders.synced} />
          <CountRow label="Failed" count={data.orders.failed} highlight />
          <CountRow label="Not synced" count={data.orders.notSynced} />
          <div className="mt-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">Last sync: {tsDisplay(data.timestamps.orderLastSyncedAt)}</p>
            <a href="/admin/orders" className="text-xs text-[#ff7a1a] font-semibold hover:underline">Sync Orders →</a>
          </div>
        </Card>
      </div>
    </div>
  )
}

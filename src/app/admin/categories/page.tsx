'use client'

import { useState, useEffect, useRef, startTransition } from 'react'
import type { Category, Product } from '@/types'

interface SyncResult {
  created: number
  updated: number
  skippedOccasions: number
  failed: number
  warnings: string[]
  errors: Record<string, string>
}

type CategoryForm = Omit<Category, 'id'>

const EMPTY_FORM: CategoryForm = {
  name: '',
  nameAr: '',
  slug: '',
  description: '',
  type: 'category',
  parentId: null,
  sortOrder: 0,
  isActive: true,
  image: '',
  topProductIds: [],
}

interface ModalState {
  open: boolean
  editing: string | null
  form: CategoryForm
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'category' | 'occasion'>('category')
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null, form: EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products'),
      ])
      if (categoriesRes.ok) setItems(await categoriesRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  const filtered = items
    .filter((c) => c.type === activeTab)
    .sort((a, b) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0))

  function openNew() {
    const nextSortOrder =
      Math.max(
        0,
        ...items
          .filter((item) => item.type === activeTab)
          .map((item) => item.sortOrder ?? item.order ?? 0)
      ) + 1
    setModal({
      open: true,
      editing: null,
      form: { ...EMPTY_FORM, type: activeTab, sortOrder: nextSortOrder },
    })
    setProductSearch('')
  }

  function openEdit(item: Category) {
    setModal({
      open: true,
      editing: item.id,
      form: {
        name: item.name,
        nameAr: item.nameAr || '',
        slug: item.slug,
        description: item.description,
        type: item.type,
        parentId: item.parentId,
        order: item.order,
        sortOrder: item.sortOrder ?? item.order ?? 0,
        isActive: item.isActive !== false,
        image: item.image,
        topProductIds: (item.topProductIds ?? []).slice(0, 10),
      },
    })
    setProductSearch('')
  }

  function closeModal() {
    setModal({ open: false, editing: null, form: EMPTY_FORM })
    setProductSearch('')
  }

  function setFormField<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }))
  }

  const selectedTopProducts = (modal.form.topProductIds ?? [])
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))

  const availableTopProducts = products
    .filter((product) => modal.form.type === 'category'
      ? product.categoryIds.includes(modal.editing ?? '')
      : product.occasionIds.includes(modal.editing ?? '')
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const searchableTopProducts = availableTopProducts
    .filter((product) => !(modal.form.topProductIds ?? []).includes(product.id))
    .filter((product) => {
      const q = productSearch.trim().toLowerCase()
      if (!q) return true
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q)
      )
    })
    .slice(0, 8)

  function addTopProduct(productId: string) {
    if (!productId) return
    const current = modal.form.topProductIds ?? []
    if (current.includes(productId) || current.length >= 10) return
    setFormField('topProductIds', [...current, productId])
    setProductSearch('')
  }

  function removeTopProduct(productId: string) {
    setFormField('topProductIds', (modal.form.topProductIds ?? []).filter((id) => id !== productId))
  }

  function moveTopProduct(productId: string, direction: -1 | 1) {
    const current = [...(modal.form.topProductIds ?? [])]
    const index = current.indexOf(productId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return
    const [item] = current.splice(index, 1)
    current.splice(nextIndex, 0, item)
    setFormField('topProductIds', current)
  }

  async function handleSave() {
    if ((modal.form.topProductIds ?? []).length > 10) return
    setSaving(true)
    try {
      const isEdit = modal.editing !== null
      const url = isEdit ? `/api/categories/${modal.editing}` : '/api/categories'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modal.form),
      })
      if (res.ok) {
        closeModal()
        await load()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const asset = await res.json()
        setFormField('image', asset.url)
      }
    } catch { /* ignore */ }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(id: string) {
    if (deleting === id) {
      try {
        await fetch(`/api/categories/${id}`, { method: 'DELETE' })
        setDeleting(null)
        await load()
      } catch { /* ignore */ }
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  async function handleSyncOdoo() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/admin/categories/sync-odoo', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSyncResult(data)
        await load()
      } else {
        const err = await res.json()
        setSyncResult({
          created: 0,
          updated: 0,
          skippedOccasions: 0,
          failed: 0,
          warnings: [err.error ?? 'Sync request failed'],
          errors: {},
        })
      }
    } catch {
      setSyncResult({
        created: 0,
        updated: 0,
        skippedOccasions: 0,
        failed: 0,
        warnings: ['Network error — could not reach the sync endpoint'],
        errors: {},
      })
    }
    setSyncing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncOdoo}
            disabled={syncing}
            className="text-sm py-2.5 px-5 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Syncing...' : 'Sync Categories to Odoo'}
          </button>
          <button onClick={openNew} className="gather-btn-primary text-sm py-2.5 px-5 shadow-md">
            + New {activeTab === 'category' ? 'Category' : 'Occasion'}
          </button>
        </div>
      </div>

      {syncResult && (
        <div className={`rounded-2xl border p-4 text-sm ${
          syncResult.failed > 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : syncResult.warnings.length > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            {syncResult.created > 0 && <span>Created: <strong>{syncResult.created}</strong></span>}
            {syncResult.updated > 0 && <span>Updated: <strong>{syncResult.updated}</strong></span>}
            {syncResult.skippedOccasions > 0 && <span>Skipped (occasions): <strong>{syncResult.skippedOccasions}</strong></span>}
            {syncResult.failed > 0 && <span>Failed: <strong className="text-red-600">{syncResult.failed}</strong></span>}
            {syncResult.created === 0 && syncResult.updated === 0 && syncResult.failed === 0 && (
              <span>No categories to sync.</span>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['category', 'occasion'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors capitalize ${
              activeTab === t ? 'bg-white text-[#ff7a1a] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'category' ? 'Categories' : 'Occasions'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Order</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#fff4e8] flex items-center justify-center text-lg shrink-0 overflow-hidden">
                        {cat.image ? (
                          <img src={cat.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#ff7a1a]">Tag</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{cat.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-500">{cat.sortOrder ?? cat.order ?? 0}</td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                      cat.isActive !== false
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.isActive !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(cat)} className="text-xs text-[#ff7a1a] hover:underline font-semibold">Edit</button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className={`text-xs font-semibold transition-colors ${
                          deleting === cat.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                        }`}
                      >
                        {deleting === cat.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No {activeTab === 'category' ? 'categories' : 'occasions'} yet.
            </div>
          )}
        </div>
      )}

      {/* Category Form Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">
                {modal.editing ? `Edit ${activeTab === 'category' ? 'Category' : 'Occasion'}` : `New ${activeTab === 'category' ? 'Category' : 'Occasion'}`}
              </h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-colors">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Name</label>
                <input
                  value={modal.form.name}
                  onChange={(e) => setFormField('name', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Arabic Name</label>
                <input
                  value={modal.form.nameAr || ''}
                  onChange={(e) => setFormField('nameAr', e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Slug</label>
                <input
                  value={modal.form.slug}
                  onChange={(e) => setFormField('slug', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Description</label>
                <input
                  value={modal.form.description}
                  onChange={(e) => setFormField('description', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Order</label>
                <input
                  type="number"
                  value={modal.form.sortOrder}
                  onChange={(e) => setFormField('sortOrder', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-3 py-3">
                <span>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Enabled</span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    Show in homepage sections and shop filter pills.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={modal.form.isActive !== false}
                  onChange={(e) => setFormField('isActive', e.target.checked)}
                  className="h-5 w-5 accent-[#ff7a1a]"
                />
              </label>
              <div className="rounded-xl border border-gray-200 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Top products</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Choose up to 10 products to show first for this {modal.form.type}.
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${selectedTopProducts.length >= 10 ? 'text-red-500' : 'text-gray-400'}`}>
                    {selectedTopProducts.length}/10
                  </span>
                </div>

                {!modal.editing ? (
                  <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    Save this {modal.form.type} first, then edit it to choose top products.
                  </p>
                ) : (
                  <>
                    <div className="mt-3">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="search"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          disabled={selectedTopProducts.length >= 10}
                          placeholder="Search products by name, slug, or ID..."
                          className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#ff7a1a] disabled:opacity-50"
                        />
                      </div>

                      {selectedTopProducts.length < 10 && (
                        <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
                          {searchableTopProducts.length > 0 ? (
                            searchableTopProducts.map((product) => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => addTopProduct(product.id)}
                                className="flex w-full items-center justify-between gap-3 border-b border-white px-3 py-2 text-left last:border-b-0 hover:bg-white"
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-sm font-semibold text-gray-700">{product.name}</span>
                                  <span className="block truncate text-xs text-gray-400">{product.slug}</span>
                                </span>
                                <span className="shrink-0 rounded-lg bg-[#fff4e8] px-2 py-1 text-xs font-bold text-[#ff7a1a]">Add</span>
                              </button>
                            ))
                          ) : (
                            <p className="px-3 py-3 text-xs text-gray-400">
                              {productSearch ? 'No matching products found.' : 'No more products available for this item.'}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {availableTopProducts.length === 0 && (
                      <p className="mt-2 text-xs text-gray-400">
                        No products are assigned to this {modal.form.type} yet.
                      </p>
                    )}

                    {selectedTopProducts.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {selectedTopProducts.map((product, index) => (
                          <div key={product.id} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                            <span className="w-5 text-xs font-black text-gray-400">{index + 1}</span>
                            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">{product.name}</span>
                            <button
                              type="button"
                              onClick={() => moveTopProduct(product.id, -1)}
                              disabled={index === 0}
                              className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-white disabled:opacity-30"
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTopProduct(product.id, 1)}
                              disabled={index === selectedTopProducts.length - 1}
                              className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-white disabled:opacity-30"
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              onClick={() => removeTopProduct(product.id)}
                              className="rounded-lg px-2 py-1 text-xs font-bold text-red-400 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Image URL</label>
                {modal.form.image && (
                  <div className="mt-2 mb-3 flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
                    <div className="h-16 w-16 overflow-hidden rounded-xl bg-white border border-gray-100">
                      <img src={modal.form.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-700">Current image</p>
                      <p className="truncate text-xs text-gray-400">{modal.form.image}</p>
                    </div>
                  </div>
                )}
                <input
                  value={modal.form.image}
                  onChange={(e) => setFormField('image', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploading ? 'Uploading...' : 'Upload image'}
                  </button>
                  {modal.form.image && (
                    <button
                      type="button"
                      onClick={() => setFormField('image', '')}
                      className="rounded-xl px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="gather-btn-primary text-sm py-2.5 px-6 shadow-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : modal.editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

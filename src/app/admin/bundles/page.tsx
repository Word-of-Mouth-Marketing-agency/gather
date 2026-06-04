'use client'

import { useState, useEffect, startTransition } from 'react'
import type { Bundle } from '@/types'

type BundleForm = Omit<Bundle, 'id'>

const EMPTY_FORM: BundleForm = {
  slug: '',
  badge: '',
  name: '',
  description: '',
  regularPrice: 0,
  offerPrice: 0,
  currency: 'EGP',
  productIds: [],
}

interface ModalState {
  open: boolean
  editing: string | null
  form: BundleForm
}

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null, form: EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [productIdsInput, setProductIdsInput] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/bundles')
      if (res.ok) setBundles(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  function openNew() {
    setProductIdsInput('')
    setModal({ open: true, editing: null, form: { ...EMPTY_FORM } })
  }

  function openEdit(item: Bundle) {
    setProductIdsInput(item.productIds.join(', '))
    setModal({
      open: true,
      editing: item.id,
      form: {
        slug: item.slug,
        badge: item.badge,
        name: item.name,
        description: item.description,
        regularPrice: item.regularPrice,
        offerPrice: item.offerPrice,
        currency: item.currency,
        productIds: item.productIds,
      },
    })
  }

  function closeModal() {
    setModal({ open: false, editing: null, form: EMPTY_FORM })
    setProductIdsInput('')
  }

  function setFormField<K extends keyof BundleForm>(key: K, value: BundleForm[K]) {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const ids = productIdsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      const payload = { ...modal.form, productIds: ids }
      const isEdit = modal.editing !== null
      const url = isEdit ? `/api/bundles/${modal.editing}` : '/api/bundles'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        closeModal()
        await load()
      }
    } catch { /* ignore */ }
    setSaving(false)
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Bundles</h1>
          <p className="text-sm text-gray-400 mt-0.5">{bundles.length} total bundles</p>
        </div>
        <button onClick={openNew} className="gather-btn-primary text-sm py-2.5 px-5 shadow-md">
          + New Bundle
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Bundle</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Regular</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Offer</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Products</th>
                <th className="px-5 py-3" />
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
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(bundle)} className="text-xs text-[#ff7a1a] hover:underline font-semibold">Edit</button>
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
              ))}
            </tbody>
          </table>

          {bundles.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">No bundles yet.</div>
          )}
        </div>
      )}

      {/* Bundle Form Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">
                {modal.editing ? 'Edit Bundle' : 'New Bundle'}
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Slug</label>
                <input
                  value={modal.form.slug}
                  onChange={(e) => setFormField('slug', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Badge</label>
                <input
                  value={modal.form.badge}
                  onChange={(e) => setFormField('badge', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                  placeholder="e.g. Birthday Offer"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Description</label>
                <textarea
                  value={modal.form.description}
                  onChange={(e) => setFormField('description', e.target.value)}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Regular Price</label>
                  <input
                    type="number"
                    value={modal.form.regularPrice}
                    onChange={(e) => setFormField('regularPrice', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Offer Price</label>
                  <input
                    type="number"
                    value={modal.form.offerPrice}
                    onChange={(e) => setFormField('offerPrice', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Currency</label>
                <input
                  value={modal.form.currency}
                  onChange={(e) => setFormField('currency', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Product IDs (comma-separated)</label>
                <input
                  value={productIdsInput}
                  onChange={(e) => setProductIdsInput(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                  placeholder="prod-1, prod-5, prod-8"
                />
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

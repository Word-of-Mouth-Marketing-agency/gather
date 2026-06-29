'use client'

import { startTransition, useEffect, useState } from 'react'
import type { ShippingFee } from '@/types'

type ShippingFeeForm = Omit<ShippingFee, 'id'>

const EMPTY_FORM: ShippingFeeForm = {
  city: '',
  fee: 50,
  isActive: true,
  sortOrder: 0,
}

interface ModalState {
  open: boolean
  editing: string | null
  form: ShippingFeeForm
}

export default function AdminShippingFeesPage() {
  const [items, setItems] = useState<ShippingFee[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null, form: EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/shipping-fees')
      if (res.ok) setItems(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  const sortedItems = [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  function openNew() {
    const nextSortOrder = Math.max(0, ...items.map((item) => item.sortOrder ?? 0)) + 1
    setModal({
      open: true,
      editing: null,
      form: { ...EMPTY_FORM, sortOrder: nextSortOrder },
    })
  }

  function openEdit(item: ShippingFee) {
    setModal({
      open: true,
      editing: item.id,
      form: {
        city: item.city,
        fee: item.fee,
        isActive: item.isActive !== false,
        sortOrder: item.sortOrder ?? 0,
      },
    })
  }

  function closeModal() {
    setModal({ open: false, editing: null, form: EMPTY_FORM })
  }

  function setFormField<K extends keyof ShippingFeeForm>(key: K, value: ShippingFeeForm[K]) {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }))
  }

  async function handleSave() {
    if (!modal.form.city.trim()) return
    setSaving(true)
    try {
      const isEdit = modal.editing !== null
      const url = isEdit ? `/api/shipping-fees/${modal.editing}` : '/api/shipping-fees'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...modal.form,
          city: modal.form.city.trim(),
          fee: Number(modal.form.fee) || 0,
          sortOrder: Number(modal.form.sortOrder) || 0,
        }),
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
        await fetch(`/api/shipping-fees/${id}`, { method: 'DELETE' })
        setDeleting(null)
        await load()
      } catch { /* ignore */ }
    } else {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
    }
  }

  async function toggleActive(item: ShippingFee) {
    try {
      await fetch(`/api/shipping-fees/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      await load()
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Shipping Fees</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} city/area fees</p>
        </div>
        <button onClick={openNew} className="gather-btn-primary text-sm py-2.5 px-5 shadow-md">
          + New Area
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">City / Area</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Fee</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Order</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{item.city}</p>
                  </td>
                  <td className="px-5 py-3 font-bold text-[#171717]">{item.fee.toLocaleString('en-EG')} EGP</td>
                  <td className="px-5 py-3 hidden md:table-cell text-gray-500">{item.sortOrder}</td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        item.isActive !== false
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.isActive !== false ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(item)} className="text-xs text-[#ff7a1a] hover:underline font-semibold">Edit</button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className={`text-xs font-semibold transition-colors ${
                          deleting === item.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                        }`}
                      >
                        {deleting === item.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {sortedItems.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              No shipping fees yet.
            </div>
          )}
        </div>
      )}

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900">
                {modal.editing ? 'Edit Shipping Fee' : 'New Shipping Fee'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <Field label="City / Area">
                <input
                  value={modal.form.city}
                  onChange={(e) => setFormField('city', e.target.value)}
                  className={inputCls}
                  placeholder="New Cairo"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Fee (EGP)">
                  <input
                    type="number"
                    min="0"
                    value={modal.form.fee}
                    onChange={(e) => setFormField('fee', Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
                <Field label="Sort order">
                  <input
                    type="number"
                    value={modal.form.sortOrder}
                    onChange={(e) => setFormField('sortOrder', Number(e.target.value))}
                    className={inputCls}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modal.form.isActive}
                  onChange={(e) => setFormField('isActive', e.target.checked)}
                  className="accent-[#ff7a1a]"
                />
                <span className="text-sm font-semibold text-gray-700">Active at checkout</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-7">
              <button onClick={closeModal} className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} className="gather-btn-primary text-sm py-2.5 px-6 disabled:opacity-60">
                {saving ? 'Saving...' : modal.editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  )
}

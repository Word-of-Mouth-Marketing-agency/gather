'use client'

import { useState, useEffect, startTransition } from 'react'
import type { Category } from '@/types'

type CategoryForm = Omit<Category, 'id'>

const EMPTY_FORM: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  type: 'category',
  parentId: null,
  order: 0,
  image: '',
}

interface ModalState {
  open: boolean
  editing: string | null
  form: CategoryForm
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'category' | 'occasion'>('category')
  const [modal, setModal] = useState<ModalState>({ open: false, editing: null, form: EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) setItems(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  const filtered = items.filter((c) => c.type === activeTab)

  function openNew() {
    setModal({ open: true, editing: null, form: { ...EMPTY_FORM, type: activeTab } })
  }

  function openEdit(item: Category) {
    setModal({
      open: true,
      editing: item.id,
      form: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        type: item.type,
        parentId: item.parentId,
        order: item.order,
        image: item.image,
      },
    })
  }

  function closeModal() {
    setModal({ open: false, editing: null, form: EMPTY_FORM })
  }

  function setFormField<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setModal((prev) => ({ ...prev, form: { ...prev.form, [key]: value } }))
  }

  async function handleSave() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} total</p>
        </div>
        <button onClick={openNew} className="gather-btn-primary text-sm py-2.5 px-5 shadow-md">
          + New {activeTab === 'category' ? 'Category' : 'Occasion'}
        </button>
      </div>

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
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#fff4e8] flex items-center justify-center text-lg shrink-0">
                        🏷️
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cat.name}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{cat.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-gray-500 font-mono text-xs">{cat.slug}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-gray-500">{cat.order}</td>
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
                  value={modal.form.order}
                  onChange={(e) => setFormField('order', Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Image URL</label>
                <input
                  value={modal.form.image}
                  onChange={(e) => setFormField('image', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Parent ID</label>
                <input
                  value={modal.form.parentId ?? ''}
                  onChange={(e) => setFormField('parentId', e.target.value || null)}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
                  placeholder="null"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Type</label>
                <select
                  value={modal.form.type}
                  onChange={(e) => setFormField('type', e.target.value as 'category' | 'occasion')}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                >
                  <option value="category">Category</option>
                  <option value="occasion">Occasion</option>
                </select>
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

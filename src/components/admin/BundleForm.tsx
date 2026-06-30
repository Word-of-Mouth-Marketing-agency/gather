'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Product } from '@/types'
import { getActiveProductPrice, isProductDiscountActive } from '@/lib/scheduled-discounts'

export interface BundleFormData {
  name: string
  slug: string
  badge: string
  description: string
  nameAr: string
  badgeAr: string
  descriptionAr: string
  productIds: string[]
  regularPrice: number
  offerPrice: number
  currency: string
  buttonText: string
  isActive: boolean
  startsAt?: string
  endsAt?: string
  isFeatured: boolean
  sortOrder: number
}

const EMPTY: BundleFormData = {
  name: '',
  slug: '',
  badge: '',
  description: '',
  nameAr: '',
  badgeAr: '',
  descriptionAr: '',
  productIds: [],
  regularPrice: 0,
  offerPrice: 0,
  currency: 'EGP',
  buttonText: 'Buy Offer',
  isActive: true,
  startsAt: '',
  endsAt: '',
  isFeatured: false,
  sortOrder: 0,
}

interface Props {
  initialData?: BundleFormData
  bundleId?: string
}

export default function BundleForm({ initialData, bundleId }: Props) {
  const router = useRouter()
  const isEdit = !!bundleId
  const [form, setForm] = useState<BundleFormData>(() => {
    if (!initialData) return EMPTY
    return {
      ...initialData,
      productIds: [...new Set(initialData.productIds)],
    }
  })
  const [products, setProducts] = useState<Product[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductPicker, setShowProductPicker] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/products')
        if (res.ok) setProducts(await res.json())
      } catch { /* ignore */ }
    }
    load()
  }, [])

  const selectedProducts = products.filter((p) => form.productIds.includes(p.id))

  const autoTotalPrice = selectedProducts.reduce(
    (sum, p) => sum + getActiveProductPrice(p),
    0
  )

  function setField<K extends keyof BundleFormData>(key: K, value: BundleFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  function toggleProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((p) => p !== id)
        : [...prev.productIds, id],
    }))
    setError('')
  }

  function removeProduct(id: string) {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((p) => p !== id),
    }))
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const ids = [...form.productIds]
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setField('productIds', ids)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) { setError('Bundle name is required.'); return }
    if (!form.slug.trim()) { setError('Slug is required.'); return }
    if (form.productIds.length === 0) { setError('At least one product must be selected.'); return }
    if (form.offerPrice <= 0) { setError('Offer price must be positive.'); return }
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) { setError('Offer end date cannot be before the start date.'); return }

    setSaving(true)
    try {
      const url = isEdit ? `/api/bundles/${bundleId}` : '/api/bundles'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = { ...form, productIds: [...new Set(form.productIds)] }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) router.push('/admin/bundles')
      else {
        const data = await res.json()
        setError(data.error || 'Failed to save bundle.')
      }
    } catch {
      setError('Network error. Please try again.')
    }
    setSaving(false)
  }

  const availableProducts = products.filter(
    (p) =>
      !form.productIds.includes(p.id) &&
      (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.includes(searchTerm.toLowerCase()))
  )

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bundle Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Badge / Label</label>
            <input
              value={form.badge}
              onChange={(e) => setField('badge', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
              placeholder="e.g. Birthday Offer"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="text-sm font-black text-[#ff7a1a] uppercase tracking-wide mb-4">Arabic Translation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Arabic Name</label>
              <input
                value={form.nameAr || ''}
                onChange={(e) => setField('nameAr', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                dir="rtl"
                placeholder="الاسم بالعربية"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Arabic Badge</label>
              <input
                value={form.badgeAr || ''}
                onChange={(e) => setField('badgeAr', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                dir="rtl"
                placeholder="الشارة بالعربية"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Arabic Description</label>
              <textarea
                value={form.descriptionAr || ''}
                onChange={(e) => setField('descriptionAr', e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                dir="rtl"
                placeholder="الوصف بالعربية"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#ff7a1a] focus:ring-[#ff7a1a]"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setField('isFeatured', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#ff7a1a] focus:ring-[#ff7a1a]"
            />
            <span className="text-sm font-semibold text-gray-700">Featured</span>
          </label>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sort Order</label>
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => setField('sortOrder', Number(e.target.value))}
              className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
        </div>
      </div>

      {/* Products in Bundle */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900">Products in Bundle</h2>
          <button
            type="button"
            onClick={() => setShowProductPicker(!showProductPicker)}
            className="text-xs text-[#ff7a1a] font-bold hover:underline"
          >
            {showProductPicker ? 'Done selecting' : '+ Add Products'}
          </button>
        </div>

        {selectedProducts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No products selected yet.</p>
        ) : (
          <div className="space-y-2">
            {selectedProducts.map((product, i) => (
              <div
                key={product.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => moveProduct(i, -1)}
                    disabled={i === 0}
                    className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(i, 1)}
                    disabled={i === selectedProducts.length - 1}
                    className="text-[10px] text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed leading-none"
                  >
                    ▼
                  </button>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt="" width={40} height={40} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-lg">🎁</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    {getActiveProductPrice(product)} EGP
                    {isProductDiscountActive(product) && <span className="line-through ml-1">{product.price} EGP</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="text-xs text-red-400 hover:text-red-500 font-semibold shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {showProductPicker && (
          <div className="border border-gray-200 rounded-xl p-3 space-y-2">
            <input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableProducts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {searchTerm ? 'No products match.' : 'All products already added.'}
                </p>
              ) : (
                availableProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt="" width={32} height={32} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-sm">🎁</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.price} EGP</p>
                    </div>
                    <span className="text-xs text-[#ff7a1a] font-bold">+ Add</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Total Products Price
            </label>
            <div className="mt-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm font-semibold text-gray-700">
              {autoTotalPrice.toLocaleString('en-EG')} EGP
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Auto-calculated from selected products</p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
              Regular Price (override)
            </label>
            <input
              type="number"
              min={0}
              value={form.regularPrice || ''}
              onChange={(e) => setField('regularPrice', Number(e.target.value))}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
              placeholder="Auto if 0"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Offer Price</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.offerPrice}
              onChange={(e) => setField('offerPrice', Number(e.target.value))}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
        </div>

        {form.regularPrice > 0 && form.regularPrice !== autoTotalPrice && (
          <p className="text-xs text-gray-400">
            Note: Manual regular price ({form.regularPrice} EGP) differs from auto-calculated total ({autoTotalPrice} EGP).
          </p>
        )}

        {form.offerPrice > 0 && (form.regularPrice || autoTotalPrice) > form.offerPrice && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-green-700">
            Discount:{' '}
            {((((form.regularPrice || autoTotalPrice) - form.offerPrice) / (form.regularPrice || autoTotalPrice)) * 100).toFixed(0)}%
            off — Save {(form.regularPrice || autoTotalPrice) - form.offerPrice} EGP
          </div>
        )}
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Offer Schedule</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Starts at</label>
            <input
              type="date"
              value={form.startsAt ?? ''}
              onChange={(e) => setField('startsAt', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ends at</label>
            <input
              type="date"
              value={form.endsAt ?? ''}
              min={form.startsAt || undefined}
              onChange={(e) => setField('endsAt', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Leave both dates empty to keep the offer always active while enabled.
        </p>
      </div>

      {/* CTA / Settings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">CTA & Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Button Text</label>
            <input
              value={form.buttonText}
              onChange={(e) => setField('buttonText', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setField('currency', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            >
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-10">
        <button
          type="submit"
          disabled={saving}
          className="gather-btn-primary text-sm py-2.5 px-6 shadow-md disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Bundle' : 'Create Bundle'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/bundles')}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

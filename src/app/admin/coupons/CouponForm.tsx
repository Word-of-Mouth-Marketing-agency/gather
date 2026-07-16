'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Coupon, CouponDiscountType, Product } from '@/types'

interface Props {
  initialData?: Coupon
}

interface FormData {
  code: string
  description: string
  discountType: CouponDiscountType
  discountValue: string
  minimumOrderAmount: string
  maximumDiscountAmount: string
  usageLimit: string
  perCustomerLimit: string
  startsAt: string
  expiresAt: string
  isActive: boolean
  applicableProductIds: string[]
  applicableCategoryIds: string[]
  excludedProductIds: string[]
}

function toInput(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return ''
  return String(value)
}

const EMPTY: FormData = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  minimumOrderAmount: '', maximumDiscountAmount: '', usageLimit: '', perCustomerLimit: '',
  startsAt: '', expiresAt: '', isActive: true,
  applicableProductIds: [], applicableCategoryIds: [], excludedProductIds: [],
}

const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors'

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-semibold text-gray-700">{label}</span>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </label>
  )
}

export default function CouponForm({ initialData }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(() => {
    if (!initialData) return { ...EMPTY }
    return {
      code: initialData.code,
      description: initialData.description || '',
      discountType: initialData.discountType,
      discountValue: toInput(initialData.discountValue),
      minimumOrderAmount: toInput(initialData.minimumOrderAmount),
      maximumDiscountAmount: toInput(initialData.maximumDiscountAmount),
      usageLimit: toInput(initialData.usageLimit),
      perCustomerLimit: toInput(initialData.perCustomerLimit),
      startsAt: initialData.startsAt ? initialData.startsAt.slice(0, 16) : '',
      expiresAt: initialData.expiresAt ? initialData.expiresAt.slice(0, 16) : '',
      isActive: initialData.isActive,
      applicableProductIds: initialData.applicableProductIds || [],
      applicableCategoryIds: initialData.applicableCategoryIds || [],
      excludedProductIds: initialData.excludedProductIds || [],
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!initialData
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    fetch('/api/products').then(async (r) => { if (r.ok) setProducts(await r.json()) }).catch(() => {})
  }, [])

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  function toggleArray(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
  }

  const categories = [...new Set(products.flatMap((p) => p.categoryIds || []))].sort()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim()) { setError('Code is required'); return }
    const val = Number(form.discountValue)
    if (!val || val <= 0) { setError('Discount value must be greater than 0'); return }
    if (form.discountType === 'percentage' && val > 100) { setError('Percentage must be 100 or less'); return }

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      code: form.code.trim(),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: val,
      minimumOrderAmount: form.minimumOrderAmount ? Number(form.minimumOrderAmount) : undefined,
      maximumDiscountAmount: form.maximumDiscountAmount ? Number(form.maximumDiscountAmount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      isActive: form.isActive,
      applicableProductIds: form.applicableProductIds.length > 0 ? form.applicableProductIds : undefined,
      applicableCategoryIds: form.applicableCategoryIds.length > 0 ? form.applicableCategoryIds : undefined,
      excludedProductIds: form.excludedProductIds.length > 0 ? form.excludedProductIds : undefined,
    }

    const url = isEdit ? `/api/admin/coupons/${initialData!.id}` : '/api/admin/coupons'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

    if (res.ok) {
      router.push('/admin/coupons')
    } else {
      const data = await res.json().catch(() => ({ error: 'Save failed' }))
      setError(data.error || 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-black text-gray-900">{isEdit ? 'Edit Coupon' : 'New Coupon'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
        {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Coupon Code">
            <input type="text" value={form.code} onChange={(e) => setField('code', e.target.value)}
              placeholder="SUMMER20" className={inputCls} required />
          </Field>

          <Field label="Discount Type">
            <select value={form.discountType} onChange={(e) => setField('discountType', e.target.value as CouponDiscountType)} className={inputCls}>
              <option value="percentage">Percentage (%)</option>
              <option value="fixed_amount">Fixed Amount (EGP)</option>
            </select>
          </Field>

          <Field label="Discount Value" hint={form.discountType === 'percentage' ? 'Between 1 and 100' : 'Amount in EGP'}>
            <input type="number" min="1" step="any" value={form.discountValue}
              onChange={(e) => setField('discountValue', e.target.value)} className={inputCls} required />
          </Field>

          <Field label="Maximum Discount Amount (optional)" hint="Only for percentage coupons">
            <input type="number" min="0" step="any" value={form.maximumDiscountAmount}
              onChange={(e) => setField('maximumDiscountAmount', e.target.value)} className={inputCls} />
          </Field>

          <Field label="Minimum Order Amount (optional)">
            <input type="number" min="0" step="any" value={form.minimumOrderAmount}
              onChange={(e) => setField('minimumOrderAmount', e.target.value)} className={inputCls} />
          </Field>

          <Field label="Active">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#ff7a1a] focus:ring-[#ff7a1a]" />
              <span className="text-sm text-gray-600">{form.isActive ? 'Coupon is active' : 'Coupon is disabled'}</span>
            </label>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Start Date (optional)">
            <input type="datetime-local" value={form.startsAt} onChange={(e) => setField('startsAt', e.target.value)} className={inputCls} />
          </Field>

          <Field label="Expiry Date (optional)">
            <input type="datetime-local" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)} className={inputCls} />
          </Field>

          <Field label="Global Usage Limit (optional)">
            <input type="number" min="1" step="1" value={form.usageLimit}
              onChange={(e) => setField('usageLimit', e.target.value)} className={inputCls} />
          </Field>

          <Field label="Per-Customer Limit (optional)">
            <input type="number" min="1" step="1" value={form.perCustomerLimit}
              onChange={(e) => setField('perCustomerLimit', e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Description (optional)">
          <textarea value={form.description} onChange={(e) => setField('description', e.target.value)}
            rows={2} className={inputCls} />
        </Field>

        {products.length > 0 && (
          <>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Applicable Categories (optional — empty = all)</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setField('applicableCategoryIds', toggleArray(form.applicableCategoryIds, cat))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      form.applicableCategoryIds.includes(cat) ? 'bg-[#ff7a1a] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Excluded Products (optional)</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {products.filter((p) => p.isActive !== false).map((p) => (
                  <button key={p.id} type="button" onClick={() => setField('excludedProductIds', toggleArray(form.excludedProductIds, p.id))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      form.excludedProductIds.includes(p.id) ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push('/admin/coupons')}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="gather-btn-primary text-sm py-2.5 px-6 disabled:opacity-60">
            {saving ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  )
}

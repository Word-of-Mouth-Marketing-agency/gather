'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Category } from '@/types'

export interface ProductFormData {
  name: string
  slug: string
  shortDescription: string
  description: string
  price: number
  salePrice: number | null
  currency: string
  stock: number
  rating?: number
  reviewCount?: number
  images: string[]
  categoryIds: string[]
  occasionIds: string[]
  crossSellIds: string[]
  featured: boolean
}

const EMPTY: ProductFormData = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  price: 0,
  salePrice: null,
  currency: 'EGP',
  stock: 0,
  rating: undefined,
  reviewCount: undefined,
  images: [],
  categoryIds: [],
  occasionIds: [],
  crossSellIds: [],
  featured: false,
}

interface Props {
  initialData?: ProductFormData
  productId?: string
}

export default function ProductForm({ initialData, productId }: Props) {
  const router = useRouter()
  const isEdit = !!productId
  const [form, setForm] = useState<ProductFormData>(initialData ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [occasions, setOccasions] = useState<Category[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/categories')
        if (res.ok) {
          const all: Category[] = await res.json()
          setCategories(all.filter((c) => c.type === 'category'))
          setOccasions(all.filter((c) => c.type === 'occasion'))
        }
      } catch { /* ignore */ }
    }
    load()
  }, [])

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleCat(id: string) {
    setField('categoryIds', form.categoryIds.includes(id)
      ? form.categoryIds.filter((c) => c !== id)
      : [...form.categoryIds, id])
  }

  function toggleOcc(id: string) {
    setField('occasionIds', form.occasionIds.includes(id)
      ? form.occasionIds.filter((o) => o !== id)
      : [...form.occasionIds, id])
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
        if (res.ok) {
          const asset = await res.json()
          setField('images', [...form.images, asset.url])
        }
      }
    } catch { /* ignore */ }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeImage(idx: number) {
    setField('images', form.images.filter((_, i) => i !== idx))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const url = isEdit ? `/api/products/${productId}` : '/api/products'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push('/admin/products')
    } catch { /* ignore */ }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="max-w-3xl space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Product Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Slug</label>
            <input
              required
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Short Description</label>
            <input
              value={form.shortDescription}
              onChange={(e) => setField('shortDescription', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Pricing & Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Price</label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setField('price', Number(e.target.value))}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sale Price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.salePrice ?? ''}
              onChange={(e) => setField('salePrice', e.target.value ? Number(e.target.value) : null)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Stock</label>
            <input
              required
              type="number"
              min={0}
              value={form.stock}
              onChange={(e) => setField('stock', Number(e.target.value))}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Rating</label>
            <input
              type="number"
              min={0}
              max={5}
              step="0.1"
              value={form.rating ?? ''}
              onChange={(e) => setField('rating', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
              placeholder="4.8"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Review Count</label>
            <input
              type="number"
              min={0}
              value={form.reviewCount ?? ''}
              onChange={(e) => setField('reviewCount', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
              placeholder="24"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="featured"
            checked={form.featured}
            onChange={(e) => setField('featured', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#ff7a1a] focus:ring-[#ff7a1a]"
          />
          <label htmlFor="featured" className="text-sm font-semibold text-gray-700 cursor-pointer">
            Featured product
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Images</h2>
        <div className="flex flex-wrap gap-3">
          {form.images.map((url, i) => (
            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 group">
              <Image src={url} alt={`Product ${i + 1}`} fill className="object-cover" sizes="96px" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#ff7a1a] transition-colors text-gray-400 hover:text-[#ff7a1a]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-semibold">{uploading ? '...' : 'Add'}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Categories</h2>
        {categories.length === 0 ? (
          <p className="text-sm text-gray-400">No categories available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                  form.categoryIds.includes(cat.id)
                    ? 'border-[#ff7a1a] bg-[#fff4e8] text-[#ff7a1a] font-semibold'
                    : 'border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(cat.id)}
                  onChange={() => toggleCat(cat.id)}
                  className="sr-only"
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Occasions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-black text-gray-900">Occasions</h2>
        {occasions.length === 0 ? (
          <p className="text-sm text-gray-400">No occasions available.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {occasions.map((occ) => (
              <label
                key={occ.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer transition-colors ${
                  form.occasionIds.includes(occ.id)
                    ? 'border-[#ff7a1a] bg-[#fff4e8] text-[#ff7a1a] font-semibold'
                    : 'border-gray-100 text-gray-600 hover:border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.occasionIds.includes(occ.id)}
                  onChange={() => toggleOcc(occ.id)}
                  className="sr-only"
                />
                <span>{occ.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-10">
        <button
          type="submit"
          disabled={saving}
          className="gather-btn-primary text-sm py-2.5 px-6 shadow-md disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

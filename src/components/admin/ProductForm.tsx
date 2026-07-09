'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { Category, Product } from '@/types'

const FBT_LIMIT = 3

export interface ProductFormData {
  name: string
  slug: string
  shortDescription: string
  description: string
  nameAr: string
  shortDescriptionAr: string
  descriptionAr: string
  sku: string
  price: number
  salePrice: number | null
  discountStartsAt?: string
  discountEndsAt?: string
  currency: string
  stock: number
  rating?: number
  reviewCount?: number
  images: string[]
  categoryIds: string[]
  occasionIds: string[]
  crossSellIds: string[]
  frequentlyBoughtTogetherIds: string[]
  featured: boolean
}

const EMPTY: ProductFormData = {
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  nameAr: '',
  shortDescriptionAr: '',
  descriptionAr: '',
  sku: '',
  price: 0,
  salePrice: null,
  discountStartsAt: '',
  discountEndsAt: '',
  currency: 'EGP',
  stock: 0,
  rating: undefined,
  reviewCount: undefined,
  images: [],
  categoryIds: [],
  occasionIds: [],
  crossSellIds: [],
  frequentlyBoughtTogetherIds: [],
  featured: false,
}

interface Props {
  initialData?: ProductFormData
  productId?: string
  initialDataAr?: { nameAr?: string; shortDescriptionAr?: string; descriptionAr?: string }
}

export default function ProductForm({ initialData, productId }: Props) {
  const router = useRouter()
  const isEdit = !!productId
  const [form, setForm] = useState<ProductFormData>(initialData ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [occasions, setOccasions] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [fbtSearch, setFbtSearch] = useState('')
  const featuredFileRef = useRef<HTMLInputElement>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)

  const featuredImage = form.images[0] ?? ''
  const galleryImages = form.images.slice(1)

  useEffect(() => {
    async function load() {
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products'),
        ])
        if (categoriesRes.ok) {
          const all: Category[] = await categoriesRes.json()
          setCategories(all.filter((c) => c.type === 'category'))
          setOccasions(all.filter((c) => c.type === 'occasion'))
        }
        if (productsRes.ok) setProducts(await productsRes.json())
      } catch { /* ignore */ }
    }
    load()
  }, [])

  function setField<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
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

  const selectedFbtProducts = form.frequentlyBoughtTogetherIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product))

  const searchableFbtProducts = products
    .filter((product) => product.id !== productId)
    .filter((product) => !form.frequentlyBoughtTogetherIds.includes(product.id))
    .filter((product) => {
      const q = fbtSearch.trim().toLowerCase()
      if (!q) return true
      const sku = (product as Product & { sku?: string }).sku ?? ''
      return (
        product.name.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.id.toLowerCase().includes(q) ||
        sku.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 8)

  function addFbtProduct(id: string) {
    if (!id || id === productId || form.frequentlyBoughtTogetherIds.includes(id)) return
    if (form.frequentlyBoughtTogetherIds.length >= FBT_LIMIT) return
    setField('frequentlyBoughtTogetherIds', [...form.frequentlyBoughtTogetherIds, id])
    setFbtSearch('')
  }

  function removeFbtProduct(id: string) {
    setField('frequentlyBoughtTogetherIds', form.frequentlyBoughtTogetherIds.filter((productId) => productId !== id))
  }

  function moveFbtProduct(id: string, direction: -1 | 1) {
    const current = [...form.frequentlyBoughtTogetherIds]
    const index = current.indexOf(id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return
    const [item] = current.splice(index, 1)
    current.splice(nextIndex, 0, item)
    setField('frequentlyBoughtTogetherIds', current)
  }

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/media/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const asset = await res.json()
    return asset.url
  }

  async function handleFeaturedUpload(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (url) setField('images', [url, ...galleryImages])
    } catch { /* ignore */ }
    setUploading(false)
    if (featuredFileRef.current) featuredFileRef.current.value = ''
  }

  async function handleGalleryUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadFile(file)
        if (url) uploaded.push(url)
      }
      if (uploaded.length > 0) setField('images', [featuredImage, ...galleryImages, ...uploaded].filter(Boolean))
    } catch { /* ignore */ }
    setUploading(false)
    if (galleryFileRef.current) galleryFileRef.current.value = ''
  }

  function removeFeaturedImage() {
    setField('images', galleryImages)
  }

  function removeGalleryImage(idx: number) {
    setField('images', [featuredImage, ...galleryImages.filter((_, i) => i !== idx)].filter(Boolean))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (form.discountStartsAt && form.discountEndsAt && form.discountEndsAt < form.discountStartsAt) {
      setError('Discount end date cannot be before the start date.')
      return
    }
    if (form.frequentlyBoughtTogetherIds.length > FBT_LIMIT) {
      setError(`Frequently Bought Together can include up to ${FBT_LIMIT} products.`)
      return
    }
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">SKU (Internal Reference)</label>
            <input
              required
              value={form.sku}
              onChange={(e) => setField('sku', e.target.value.toUpperCase())}
              placeholder="e.g. GFT-BDAY-BOX"
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
            <p className="mt-1 text-xs text-gray-400">SKU is required for Odoo sync and becomes the Odoo Internal Reference. Uppercase, hyphens allowed.</p>
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
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Arabic Short Description</label>
              <input
                value={form.shortDescriptionAr || ''}
                onChange={(e) => setField('shortDescriptionAr', e.target.value)}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                dir="rtl"
                placeholder="وصف مختصر بالعربية"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Arabic Description</label>
              <textarea
                value={form.descriptionAr || ''}
                onChange={(e) => setField('descriptionAr', e.target.value)}
                rows={4}
                className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
                dir="rtl"
                placeholder="الوصف بالعربية"
              />
            </div>
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
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Discount starts</label>
            <input
              type="date"
              value={form.discountStartsAt ?? ''}
              onChange={(e) => setField('discountStartsAt', e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Discount ends</label>
            <input
              type="date"
              value={form.discountEndsAt ?? ''}
              min={form.discountStartsAt || undefined}
              onChange={(e) => setField('discountEndsAt', e.target.value)}
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
        <div>
          <h2 className="text-lg font-black text-gray-900">Product Images</h2>
          <p className="mt-1 text-xs text-gray-400">The featured image is used first on product cards and as the main detail image.</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Featured Image</label>
          <div className="flex flex-wrap gap-3">
            {featuredImage ? (
              <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100 group">
                <img src={featuredImage} alt="Featured product image" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={removeFeaturedImage}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => featuredFileRef.current?.click()}
                className="w-28 h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#ff7a1a] transition-colors text-gray-400 hover:text-[#ff7a1a]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] font-semibold">{uploading ? '...' : 'Add featured'}</span>
              </button>
            )}
          </div>
          {featuredImage && (
            <button
              type="button"
              onClick={() => featuredFileRef.current?.click()}
              disabled={uploading}
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Replace featured image'}
            </button>
          )}
          <input
            ref={featuredFileRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFeaturedUpload(e.target.files)}
            className="hidden"
          />
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Product Gallery Images</label>
          <div className="flex flex-wrap gap-3">
            {galleryImages.map((url, i) => (
              <div key={`${url}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 group">
                <img src={url} alt={`Product gallery ${i + 1}`} className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  &times;
                </button>
              </div>
            ))}
            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#ff7a1a] transition-colors text-gray-400 hover:text-[#ff7a1a]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] font-semibold">{uploading ? '...' : 'Add gallery'}</span>
              <input
                ref={galleryFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleGalleryUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">Frequently Bought Together</h2>
            <p className="mt-1 text-xs text-gray-400">
              Choose up to {FBT_LIMIT} products to show with this product. If empty, the storefront uses automatic suggestions.
            </p>
          </div>
          <span className={`text-xs font-bold ${selectedFbtProducts.length >= FBT_LIMIT ? 'text-red-500' : 'text-gray-400'}`}>
            {selectedFbtProducts.length}/{FBT_LIMIT}
          </span>
        </div>

        <div className="relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={fbtSearch}
            onChange={(e) => setFbtSearch(e.target.value)}
            disabled={selectedFbtProducts.length >= FBT_LIMIT}
            placeholder="Search products by name, slug, or ID..."
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:border-[#ff7a1a] disabled:opacity-50"
          />
        </div>

        {selectedFbtProducts.length < FBT_LIMIT && (
          <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
            {searchableFbtProducts.length > 0 ? (
              searchableFbtProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addFbtProduct(product.id)}
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
                {fbtSearch ? 'No matching products found.' : 'No products available.'}
              </p>
            )}
          </div>
        )}

        {selectedFbtProducts.length > 0 && (
          <div className="space-y-2">
            {selectedFbtProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
                <span className="w-5 text-xs font-black text-gray-400">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-700">{product.name}</span>
                <button
                  type="button"
                  onClick={() => moveFbtProduct(product.id, -1)}
                  disabled={index === 0}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-white disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => moveFbtProduct(product.id, 1)}
                  disabled={index === selectedFbtProducts.length - 1}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-gray-500 hover:bg-white disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeFbtProduct(product.id)}
                  className="rounded-lg px-2 py-1 text-xs font-bold text-red-400 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
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

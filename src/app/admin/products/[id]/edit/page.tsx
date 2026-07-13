'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ProductForm from '@/components/admin/ProductForm'
import type { Product } from '@/types'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${id}?includeArchived=true`)
        if (res.ok) setProduct(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Product not found.</p>
        <Link href="/admin/products" className="text-[#ff7a1a] font-bold hover:underline text-sm">
          ← Back to Products
        </Link>
      </div>
    )
  }

  const formData = {
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    nameAr: product.nameAr || '',
    shortDescriptionAr: product.shortDescriptionAr || '',
    descriptionAr: product.descriptionAr || '',
    sku: product.sku ?? '',
    price: product.price,
    salePrice: product.salePrice,
    discountStartsAt: product.discountStartsAt || '',
    discountEndsAt: product.discountEndsAt || '',
    currency: product.currency,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    images: product.images,
    categoryIds: product.categoryIds,
    occasionIds: product.occasionIds,
    crossSellIds: product.crossSellIds,
    frequentlyBoughtTogetherIds: product.frequentlyBoughtTogetherIds ?? [],
    featured: product.featured,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Products
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">Edit: {product.name}</h1>
      </div>
      <ProductForm initialData={formData} productId={id} />
    </div>
  )
}

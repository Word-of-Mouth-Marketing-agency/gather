'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import BundleForm from '@/components/admin/BundleForm'
import type { Bundle } from '@/types'

export default function EditBundlePage() {
  const { id } = useParams<{ id: string }>()
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bundles/${id}`)
        if (res.ok) setBundle(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return <p className="text-sm text-gray-400">Loading...</p>
  }

  if (!bundle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">Bundle not found.</p>
        <Link href="/admin/bundles" className="text-[#ff7a1a] font-bold hover:underline text-sm">
          ← Back to Bundles
        </Link>
      </div>
    )
  }

  const formData = {
    name: bundle.name,
    slug: bundle.slug,
    badge: bundle.badge || '',
    description: bundle.description || '',
    productIds: bundle.productIds,
    regularPrice: bundle.regularPrice || 0,
    offerPrice: bundle.offerPrice,
    currency: bundle.currency,
    buttonText: bundle.buttonText || 'Buy Offer',
    isActive: bundle.isActive,
    startsAt: bundle.startsAt || '',
    endsAt: bundle.endsAt || '',
    isFeatured: bundle.isFeatured,
    sortOrder: bundle.sortOrder,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/bundles" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Bundles
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">Edit: {bundle.name}</h1>
      </div>
      <BundleForm initialData={formData} bundleId={id} />
    </div>
  )
}

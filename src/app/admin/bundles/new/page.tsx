import type { Metadata } from 'next'
import Link from 'next/link'
import BundleForm from '@/components/admin/BundleForm'

export const metadata: Metadata = { title: 'New Bundle' }

export default function NewBundlePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/bundles" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Bundles
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">New Bundle</h1>
      </div>
      <BundleForm />
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import ProductForm from '@/components/admin/ProductForm'

export const metadata: Metadata = { title: 'New Product' }

export default function NewProductPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Products
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">New Product</h1>
      </div>
      <ProductForm />
    </div>
  )
}

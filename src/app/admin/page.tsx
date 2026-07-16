import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllProducts, getAllCategories, getAllPages } from '@/lib/data'
import { requireAdmin } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
  const session = await requireAdmin()
  const products = getAllProducts()
  const categories = getAllCategories()
  const pages = getAllPages()
  const featuredProducts = products.filter((p) => p.featured)
  const outOfStock = products.filter((p) => p.stock === 0)
  const isAdmin = session.role === 'super_admin'
  const canContent = hasPermission(session.role, 'products.content.read')
  const canFinance = hasPermission(session.role, 'products.pricing.read')
  const canOrders = hasPermission(session.role, 'orders.read')
  const canCustomers = hasPermission(session.role, 'customers.read')

  const stats = []
  if (canContent) {
    stats.push({ label: 'Total Products', value: products.length, href: '/admin/products', color: 'bg-blue-50 text-blue-600' })
    stats.push({ label: 'Categories', value: categories.length, href: '/admin/categories', color: 'bg-purple-50 text-purple-600' })
    stats.push({ label: 'Featured', value: featuredProducts.length, href: '/admin/products', color: 'bg-[#fff4e8] text-[#ff7a1a]' })
  }
  if (canFinance) {
    stats.push({ label: 'Out of Stock', value: outOfStock.length, href: '/admin/products', color: 'bg-red-50 text-red-500' })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">جژر admin overview</p>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
            >
              <p className="text-sm font-semibold text-gray-400">{stat.label}</p>
              <p className={`text-3xl font-black mt-1 ${stat.color.split(' ').pop()}`}>
                {stat.value}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {canContent && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-sm text-gray-700">Products</h2>
              <Link href="/admin/products" className="text-xs text-[#ff7a1a] font-bold hover:underline">
                Manage →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {products.slice(0, 5).map((product) => (
                <Link
                  key={product.id}
                  href={`/admin/products`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#f8f8f8] flex items-center justify-center text-lg shrink-0">
                    🎁
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.price} EGP · Stock: {product.stock}</p>
                  </div>
                  {product.featured && (
                    <span className="text-xs bg-[#fff4e8] text-[#ff7a1a] font-bold px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-sm text-gray-700">Pages</h2>
              <Link href="/admin/pages" className="text-xs text-[#ff7a1a] font-bold hover:underline">
                Manage →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href="/admin/pages"
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-lg shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{page.title}</p>
                    <p className="text-xs text-gray-400">{page.sections.length} sections</p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">/{page.slug}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

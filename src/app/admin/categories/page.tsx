'use client'

import { useState } from 'react'
import { getAllCategories } from '@/lib/data'
import type { Category } from '@/types'

export default function AdminCategoriesPage() {
  const allCategories = getAllCategories()
  const [categories] = useState<Category[]>(allCategories)
  const [activeTab, setActiveTab] = useState<'category' | 'occasion'>('category')

  const filtered = categories.filter((c) => c.type === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} total</p>
        </div>
        <button className="gather-btn-primary text-sm py-2.5 px-5 shadow-md">
          + New Category
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
                    <button className="text-xs text-[#ff7a1a] hover:underline font-semibold">Edit</button>
                    <button className="text-xs text-red-400 hover:text-red-500 font-semibold">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

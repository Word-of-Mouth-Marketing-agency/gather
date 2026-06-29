'use client'

import Link from 'next/link'
import { getAllPages } from '@/lib/data'
import type { Page } from '@/types'

const pageEditorRoutes: Record<string, string> = {
  home: '/admin/pages/homepage',
}

export default function AdminPagesPage() {
  const allPages = getAllPages()
  const pages = allPages as Page[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pages</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage page content and sections</p>
      </div>

      <div className="space-y-3">
        {pages.map((page) => {
          const editRoute = pageEditorRoutes[page.slug]
          return (
            <div key={page.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg">📄</div>
                  <div>
                    <p className="font-bold text-gray-900">{page.title}</p>
                    <p className="text-xs text-gray-400">/{page.slug} · {page.sections.length} sections</p>
                  </div>
                </div>
                {editRoute ? (
                  <Link
                    href={editRoute}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff7a1a] text-white text-sm font-bold hover:bg-[#e06c0f] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Edit Content
                  </Link>
                ) : (
                  <span className="text-xs text-gray-400 font-medium px-3 py-1.5 rounded-lg bg-gray-50">
                    No editor yet
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

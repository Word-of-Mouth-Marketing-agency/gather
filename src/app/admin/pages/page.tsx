'use client'

import { useState } from 'react'
import { getAllPages } from '@/lib/data'
import type { Page, Section } from '@/types'

export default function AdminPagesPage() {
  const allPages = getAllPages()
  const [pages] = useState<Page[]>(allPages)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Pages</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage page sections and content</p>
      </div>

      <div className="space-y-3">
        {pages.map((page) => (
          <div key={page.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === page.id ? null : page.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-lg">📄</div>
                <div>
                  <p className="font-bold text-gray-900">{page.title}</p>
                  <p className="text-xs text-gray-400">/{page.slug} · {page.sections.length} sections</p>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${expanded === page.id ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expanded === page.id && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sections</p>
                  <button className="text-xs text-[#ff7a1a] font-bold hover:underline">+ Add Section</button>
                </div>
                {[...page.sections]
                  .sort((a, b) => a.order - b.order)
                  .map((section) => (
                    <SectionRow key={section.id} section={section} />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionRow({ section }: { section: Section }) {
  const sectionTypeLabels: Record<string, string> = {
    hero: 'Hero',
    banner: 'Banner',
    'product-grid': 'Product Grid',
    'category-grid': 'Category Grid',
    'occasion-grid': 'Occasion Grid',
    'text-block': 'Text Block',
    'image-block': 'Image Block',
    'moments-wall': 'Moments Wall',
    'cta-banner': 'CTA Banner',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
      <div className="w-2 h-8 rounded-full bg-[#ff7a1a]/30 shrink-0" />
      <div className="flex items-center gap-2 text-gray-400 text-xs shrink-0">
        <span>{section.order}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">
          {sectionTypeLabels[section.type] ?? section.type}
        </p>
        <p className="text-xs text-gray-400 font-mono">{section.id}</p>
      </div>
      <span
        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          section.visible ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
        }`}
      >
        {section.visible ? 'Visible' : 'Hidden'}
      </span>
      <button className="text-xs text-[#ff7a1a] hover:underline font-semibold shrink-0">Edit</button>
    </div>
  )
}

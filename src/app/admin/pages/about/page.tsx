'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { AboutPageContent, AboutSection } from '@/types'

export default function AdminAboutEditorPage() {
  const [content, setContent] = useState<AboutPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/pages/about')
      .then((r) => r.json())
      .then((data) => {
        setContent(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const save = useCallback(async () => {
    if (!content) return
    setSaving(true)
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/pages/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      if (res.ok) {
        const updated = await res.json()
        setContent(updated)
        setSaveStatus('success')
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
    setSaving(false)
    setTimeout(() => setSaveStatus('idle'), 4000)
  }, [content])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">About Page Editor</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-96" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-black text-gray-900">About Page Editor</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">Failed to load about page content</p>
        </div>
      </div>
    )
  }

  const updateSection1 = (patch: Partial<AboutSection>) => {
    setContent({ ...content, section1: { ...content.section1, ...patch } })
  }

  const updateSection2 = (patch: Partial<AboutSection>) => {
    setContent({ ...content, section2: { ...content.section2, ...patch } })
  }

  const updateListItem = (index: number, value: string) => {
    const newList = [...content.section2ListItems]
    newList[index] = value
    setContent({ ...content, section2ListItems: newList })
  }

  const addListItem = () => {
    setContent({ ...content, section2ListItems: [...content.section2ListItems, ''] })
  }

  const removeListItem = (index: number) => {
    const newList = content.section2ListItems.filter((_, i) => i !== index)
    setContent({ ...content, section2ListItems: newList })
  }

  const handleUpload = async (file: File, section: 1 | 2) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const asset = await res.json()
        if (section === 1) {
          updateSection1({ image: asset.url })
        } else {
          updateSection2({ image: asset.url })
        }
      }
    } catch {
      // upload failed silently
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages" className="text-gray-400 hover:text-gray-600 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">About Page Editor</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage about page content and images</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff7a1a] text-white font-bold text-sm hover:bg-[#e06c0f] disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>
      </div>

      {saveStatus === 'success' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Changes saved successfully.
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Failed to save. Please try again.
        </div>
      )}

      <SectionPanel title="Page Settings" description="General settings for the About page.">
        <Field label="Page Title" value={content.pageTitle} onChange={(v) => setContent({ ...content, pageTitle: v })} hint="Shown in the page title banner" />
      </SectionPanel>

      <SectionPanel title="Section 1 — Our Story" description="The first section with story text and image.">
        <div className="space-y-4">
          <Field label="Title" value={content.section1.title} onChange={(v) => updateSection1({ title: v })} />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Body Text</label>
            <textarea
              value={content.section1.body}
              onChange={(e) => updateSection1({ body: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
            />
            <p className="text-[11px] text-gray-300">Use double line breaks to separate paragraphs</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">Section Image</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={content.section1.image}
                onChange={(e) => updateSection1({ image: e.target.value })}
                placeholder="/assets/gather/image.webp"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
              />
              <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                Upload
                <input type="file" accept="image/*,.gif,.webp" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 1)
                }} />
              </label>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#f8f6f3] overflow-hidden flex items-center justify-center h-48">
              {content.section1.image ? (
                <img src={content.section1.image} alt="Section 1 preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-gray-400 font-medium">No image set</p>
              )}
            </div>
            {content.section1.image && (
              <p className="text-xs text-gray-400 font-mono truncate" title={content.section1.image}>{content.section1.image}</p>
            )}
          </div>
        </div>
      </SectionPanel>

      <SectionPanel title="Section 2 — What we OFFER" description="The second section with offer list and image.">
        <div className="space-y-4">
          <Field label="Title" value={content.section2.title} onChange={(v) => updateSection2({ title: v })} hint='The word "OFFER" will be highlighted in orange' />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Intro Text</label>
            <textarea
              value={content.section2.body}
              onChange={(e) => updateSection2({ body: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500">List Items</label>
              <button
                onClick={addListItem}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Add Item
              </button>
            </div>
            {content.section2ListItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#fff4e8] flex items-center justify-center text-[#ff7a1a] text-xs font-bold shrink-0">{idx + 1}</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem(idx, e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
                <button
                  onClick={() => removeListItem(idx)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 shrink-0"
                  title="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">Section Image</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={content.section2.image}
                onChange={(e) => updateSection2({ image: e.target.value })}
                placeholder="/assets/gather/image.webp"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
              />
              <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                Upload
                <input type="file" accept="image/*,.gif,.webp" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 2)
                }} />
              </label>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#f8f6f3] overflow-hidden flex items-center justify-center h-48">
              {content.section2.image ? (
                <img src={content.section2.image} alt="Section 2 preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-gray-400 font-medium">No image set</p>
              )}
            </div>
            {content.section2.image && (
              <p className="text-xs text-gray-400 font-mono truncate" title={content.section2.image}>{content.section2.image}</p>
            )}
          </div>
        </div>
      </SectionPanel>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-3 flex items-center justify-between gap-4 z-40 lg:left-64">
        <p className="text-xs text-gray-400 truncate">
          {saveStatus === 'success' ? '✓ All changes saved' : saveStatus === 'error' ? '✗ Save failed' : 'Unsaved changes will be lost'}
        </p>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#ff7a1a] text-white font-bold text-sm hover:bg-[#e06c0f] disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function SectionPanel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
      />
      {hint && <p className="text-[11px] text-gray-300">{hint}</p>}
    </div>
  )
}
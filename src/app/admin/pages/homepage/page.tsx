'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { HomepageContent, HeroSlide, HeroText, AboutGatherContent, WhyGatherCard } from '@/types'

type Tab = 'hero-slides' | 'hero-text' | 'about' | 'why-cards'

export default function AdminHomepageEditorPage() {
  const [content, setContent] = useState<HomepageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [tab, setTab] = useState<Tab>('hero-slides')

  useEffect(() => {
    fetch('/api/homepage')
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
    setSaveMsg('')
    try {
      const res = await fetch('/api/homepage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      })
      if (res.ok) {
        const updated = await res.json()
        setContent(updated)
        setSaveMsg('Saved successfully')
      } else {
        setSaveMsg('Save failed')
      }
    } catch {
      setSaveMsg('Save failed')
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
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
          <h1 className="text-2xl font-black text-gray-900">Homepage Editor</h1>
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
          <h1 className="text-2xl font-black text-gray-900">Homepage Editor</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">Failed to load homepage content</p>
        </div>
      </div>
    )
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'hero-slides', label: 'Hero Slides' },
    { key: 'hero-text', label: 'Hero Text' },
    { key: 'about', label: 'About Gather' },
    { key: 'why-cards', label: 'Why Gather' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Homepage Editor</h1>
            <p className="text-xs text-gray-400 mt-0.5">Edit homepage content, slides, and sections</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-sm font-semibold ${saveMsg.includes('failed') ? 'text-red-500' : 'text-green-600'}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff7a1a] text-white font-bold text-sm hover:bg-[#e06c0f] disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hero-slides' && (
        <HeroSlidesEditor
          slides={content.heroSlides}
          onChange={(slides) => setContent({ ...content, heroSlides: slides })}
        />
      )}
      {tab === 'hero-text' && (
        <HeroTextEditor
          heroText={content.heroText}
          onChange={(heroText) => setContent({ ...content, heroText })}
        />
      )}
      {tab === 'about' && (
        <AboutEditor
          about={content.aboutGather}
          onChange={(aboutGather) => setContent({ ...content, aboutGather })}
        />
      )}
      {tab === 'why-cards' && (
        <WhyCardsEditor
          cards={content.whyGatherCards}
          onChange={(whyGatherCards) => setContent({ ...content, whyGatherCards })}
        />
      )}
    </div>
  )
}

function HeroSlidesEditor({ slides, onChange }: { slides: HeroSlide[]; onChange: (s: HeroSlide[]) => void }) {
  const sorted = [...slides].sort((a, b) => a.sortOrder - b.sortOrder)

  const addSlide = () => {
    const maxOrder = slides.reduce((max, s) => Math.max(max, s.sortOrder), 0)
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      src: '',
      mobileSrc: '',
      alt: '',
      sortOrder: maxOrder + 1,
      isActive: true,
    }
    onChange([...slides, newSlide])
  }

  const updateSlide = (id: string, patch: Partial<HeroSlide>) => {
    onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const removeSlide = (id: string) => {
    onChange(slides.filter((s) => s.id !== id))
  }

  const moveSlide = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((s) => s.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const currentOrder = sorted[idx].sortOrder
    const swapOrder = sorted[swapIdx].sortOrder
    onChange(
      slides.map((s) => {
        if (s.id === sorted[idx].id) return { ...s, sortOrder: swapOrder }
        if (s.id === sorted[swapIdx].id) return { ...s, sortOrder: currentOrder }
        return s
      })
    )
  }

  const handleUpload = async (file: File, slideId: string, field: 'src' | 'mobileSrc') => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const asset = await res.json()
        updateSlide(slideId, { [field]: asset.url })
      }
    } catch {
      // upload failed silently
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-500">{sorted.length} slide{sorted.length !== 1 ? 's' : ''}</p>
        <button
          onClick={addSlide}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
        >
          + Add Slide
        </button>
      </div>

      {sorted.map((slide, idx) => (
        <div key={slide.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-lg px-2 py-1">#{idx + 1}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${slide.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {slide.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => moveSlide(slide.id, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              </button>
              <button onClick={() => moveSlide(slide.id, 1)} disabled={idx === sorted.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <button onClick={() => removeSlide(slide.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Desktop Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slide.src}
                  onChange={(e) => updateSlide(slide.id, { src: e.target.value })}
                  placeholder="/assets/gather/banner.webp"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
                <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f, slide.id, 'src')
                  }} />
                </label>
              </div>
              {slide.src && (
                <img src={slide.src} alt="" className="h-20 w-full object-cover rounded-lg border border-gray-100" />
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Mobile Image</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={slide.mobileSrc}
                  onChange={(e) => updateSlide(slide.id, { mobileSrc: e.target.value })}
                  placeholder="/assets/gather/mobile-banner.webp"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
                <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                  Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleUpload(f, slide.id, 'mobileSrc')
                  }} />
                </label>
              </div>
              {slide.mobileSrc && (
                <img src={slide.mobileSrc} alt="" className="h-20 w-full object-cover rounded-lg border border-gray-100" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Alt Text</label>
              <input
                type="text"
                value={slide.alt}
                onChange={(e) => updateSlide(slide.id, { alt: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Sort Order</label>
              <input
                type="number"
                value={slide.sortOrder}
                onChange={(e) => updateSlide(slide.id, { sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={slide.isActive}
              onChange={(e) => updateSlide(slide.id, { isActive: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#ff7a1a] focus:ring-[#ff7a1a]"
            />
            <span className="text-sm font-semibold text-gray-600">Active (visible on homepage)</span>
          </label>
        </div>
      ))}
    </div>
  )
}

function HeroTextEditor({ heroText, onChange }: { heroText: HeroText; onChange: (h: HeroText) => void }) {
  const update = (field: keyof HeroText, value: string) => {
    onChange({ ...heroText, [field]: value })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <p className="text-sm font-bold text-gray-500">Hero overlay text displayed over the banner slides</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Brand Line" value={heroText.brandLine} onChange={(v) => update('brandLine', v)} />
        <Field label="Headline" value={heroText.headline} onChange={(v) => update('headline', v)} />
      </div>
      <Field label="Subtitle" value={heroText.subtitle} onChange={(v) => update('subtitle', v)} />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Primary CTA</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Label" value={heroText.ctaPrimaryLabel} onChange={(v) => update('ctaPrimaryLabel', v)} />
          <Field label="URL" value={heroText.ctaPrimaryUrl} onChange={(v) => update('ctaPrimaryUrl', v)} />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Secondary CTA</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Label" value={heroText.ctaSecondaryLabel} onChange={(v) => update('ctaSecondaryLabel', v)} />
          <Field label="URL" value={heroText.ctaSecondaryUrl} onChange={(v) => update('ctaSecondaryUrl', v)} />
        </div>
      </div>
    </div>
  )
}

function AboutEditor({ about, onChange }: { about: AboutGatherContent; onChange: (a: AboutGatherContent) => void }) {
  const update = (field: keyof AboutGatherContent, value: string) => {
    onChange({ ...about, [field]: value })
  }

  const handleUpload = async (file: File, field: 'leftImage' | 'rightImage') => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const asset = await res.json()
        update(field, asset.url)
      }
    } catch {
      // upload failed silently
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      <p className="text-sm font-bold text-gray-500">About Gather section content and media</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Title" value={about.title} onChange={(v) => update('title', v)} />
        <Field label="CTA Text" value={about.ctaText} onChange={(v) => update('ctaText', v)} />
      </div>
      <Field label="Subtitle" value={about.subtitle} onChange={(v) => update('subtitle', v)} />
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-500">Body</label>
        <textarea
          value={about.body}
          onChange={(e) => update('body', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
        />
      </div>
      <Field label="CTA URL" value={about.ctaUrl} onChange={(v) => update('ctaUrl', v)} />

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Side Media</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Left Image / GIF</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={about.leftImage}
                onChange={(e) => update('leftImage', e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
              />
              <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                Upload
                <input type="file" accept="image/*,.gif" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 'leftImage')
                }} />
              </label>
            </div>
            {about.leftImage && (
              <img src={about.leftImage} alt="" className="h-24 w-full object-contain rounded-lg border border-gray-100 bg-[#FCECDC]" />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Right Image / GIF</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={about.rightImage}
                onChange={(e) => update('rightImage', e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
              />
              <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors">
                Upload
                <input type="file" accept="image/*,.gif" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 'rightImage')
                }} />
              </label>
            </div>
            {about.rightImage && (
              <img src={about.rightImage} alt="" className="h-24 w-full object-contain rounded-lg border border-gray-100 bg-[#FCECDC]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function WhyCardsEditor({ cards, onChange }: { cards: WhyGatherCard[]; onChange: (c: WhyGatherCard[]) => void }) {
  const sorted = [...cards].sort((a, b) => a.sortOrder - b.sortOrder)

  const updateCard = (id: string, patch: Partial<WhyGatherCard>) => {
    onChange(cards.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const moveCard = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((c) => c.id === id)
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const currentOrder = sorted[idx].sortOrder
    const swapOrder = sorted[swapIdx].sortOrder
    onChange(
      cards.map((c) => {
        if (c.id === sorted[idx].id) return { ...c, sortOrder: swapOrder }
        if (c.id === sorted[swapIdx].id) return { ...c, sortOrder: currentOrder }
        return c
      })
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-gray-500">{sorted.length} feature cards (currently 3)</p>

      {sorted.map((card, idx) => (
        <div key={card.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 bg-gray-100 rounded-lg px-2 py-1">#{idx + 1}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => moveCard(card.id, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
              </button>
              <button onClick={() => moveCard(card.id, 1)} disabled={idx === sorted.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          </div>
          <Field label="Title" value={card.title} onChange={(v) => updateCard(card.id, { title: v })} />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Description</label>
            <textarea
              value={card.description}
              onChange={(e) => updateCard(card.id, { description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Sort Order</label>
            <input
              type="number"
              value={card.sortOrder}
              onChange={(e) => updateCard(card.id, { sortOrder: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-gray-500">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
      />
    </div>
  )
}
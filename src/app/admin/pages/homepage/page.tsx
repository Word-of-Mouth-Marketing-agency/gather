'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { HomepageContent, HeroSlide, HeroText, AboutGatherContent, WhyGatherCard } from '@/types'

type Tab = 'hero-slides' | 'hero-text' | 'about' | 'why-cards'

export default function AdminHomepageEditorPage() {
  const [content, setContent] = useState<HomepageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [tab, setTab] = useState<Tab>('hero-slides')
  const [lang, setLang] = useState<'en' | 'ar'>('en')

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
    setSaveStatus('idle')
    try {
      const res = await fetch('/api/homepage', {
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

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'hero-slides', label: 'Hero Slides', icon: '🖼️' },
    { key: 'hero-text', label: 'Hero Text', icon: '✏️' },
    { key: 'about', label: 'About Gather', icon: '📖' },
    { key: 'why-cards', label: 'Why Gather', icon: '⭐' },
  ]

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
            <h1 className="text-2xl font-black text-gray-900">Homepage Editor</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage hero, about, and feature content</p>
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
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold animate-in fade-in">
          <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Changes saved successfully. The homepage will reflect your updates.
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

      <div className="flex items-center gap-2">
        <button
          onClick={() => setLang('en')}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${lang === 'en' ? 'bg-[#ff7a1a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          English
        </button>
        <button
          onClick={() => setLang('ar')}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-colors ${lang === 'ar' ? 'bg-[#ff7a1a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          العربية
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="hidden sm:inline">{t.icon}</span>
            <span className="truncate">{t.label}</span>
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
          heroText={lang === 'ar' ? (content.ar?.heroText || content.heroText) : content.heroText}
          onChange={(heroText) => {
            if (lang === 'ar') {
              setContent({ ...content, ar: { ...content.ar, heroText } })
            } else {
              setContent({ ...content, heroText })
            }
          }}
        />
      )}
      {tab === 'about' && (
        <AboutEditor
          about={lang === 'ar' ? (content.ar?.aboutGather || content.aboutGather) : content.aboutGather}
          onChange={(aboutGather) => {
            if (lang === 'ar') {
              setContent({ ...content, ar: { ...content.ar, aboutGather } })
            } else {
              setContent({ ...content, aboutGather })
            }
          }}
        />
      )}
      {tab === 'why-cards' && (
        <WhyCardsEditor
          cards={lang === 'ar' ? (content.ar?.whyGatherCards || content.whyGatherCards) : content.whyGatherCards}
          onChange={(whyGatherCards) => {
            if (lang === 'ar') {
              setContent({ ...content, ar: { ...content.ar, whyGatherCards } })
            } else {
              setContent({ ...content, whyGatherCards })
            }
          }}
        />
      )}

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

function ImagePreviewBox({ src, label, aspectRatio = 'video' }: { src: string; label: string; aspectRatio?: 'video' | 'portrait' }) {
  if (!src) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center h-32">
          <p className="text-xs text-gray-300 font-medium">No image set</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
      <div className={`rounded-xl border border-gray-200 bg-[#f8f6f3] overflow-hidden flex items-center justify-center ${aspectRatio === 'portrait' ? 'h-48' : 'h-36'}`}>
        <img src={src} alt="" className="max-w-full max-h-full object-contain" />
      </div>
      <p className="text-xs text-gray-400 font-mono truncate" title={src}>{src}</p>
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
    if (!confirm('Delete this slide?')) return
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

  const handleUpload = async (file: File, slideId: string, field: 'src' | 'mobileSrc' | 'srcAr' | 'mobileSrcAr') => {
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
    <div className="space-y-5">
      <SectionPanel title="Hero Slider" description="Manage the banner slides shown at the top of the homepage. Each slide has a desktop and mobile image.">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{sorted.length} slide{sorted.length !== 1 ? 's' : ''} total</p>
          <button
            onClick={addSlide}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Add Slide
          </button>
        </div>

        <div className="space-y-4">
          {sorted.map((slide, idx) => (
            <div key={slide.id} className={`rounded-xl border-2 p-4 space-y-4 transition-colors ${slide.isActive ? 'border-gray-200 bg-white' : 'border-dashed border-gray-200 bg-gray-50/50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ff7a1a] text-white flex items-center justify-center text-sm font-black shrink-0">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">Slide {idx + 1}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{slide.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${slide.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) => updateSlide(slide.id, { isActive: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    {slide.isActive ? 'Active' : 'Hidden'}
                  </label>
                  <button onClick={() => moveSlide(slide.id, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400" title="Move up">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveSlide(slide.id, 1)} disabled={idx === sorted.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400" title="Move down">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => removeSlide(slide.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Delete slide">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500">Desktop Image</label>
                    <span className="text-[10px] text-gray-300 font-medium bg-gray-100 px-1.5 py-0.5 rounded">1920×1080 recommended</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slide.src}
                      onChange={(e) => updateSlide(slide.id, { src: e.target.value })}
                      placeholder="/assets/gather/banner.webp"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
                    />
                    <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUpload(f, slide.id, 'src')
                      }} />
                    </label>
                  </div>
                  <ImagePreviewBox src={slide.src} label="Preview" aspectRatio="video" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-gray-500">Mobile Image</label>
                    <span className="text-[10px] text-gray-300 font-medium bg-gray-100 px-1.5 py-0.5 rounded">863×1822 ratio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={slide.mobileSrc}
                      onChange={(e) => updateSlide(slide.id, { mobileSrc: e.target.value })}
                      placeholder="/assets/gather/mobile-banner.webp"
                      className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
                    />
                    <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                      Upload
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleUpload(f, slide.id, 'mobileSrc')
                      }} />
                    </label>
                  </div>
                  <ImagePreviewBox src={slide.mobileSrc} label="Preview" aspectRatio="portrait" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Alt Text (accessibility)</label>
                <input
                  type="text"
                  value={slide.alt}
                  onChange={(e) => updateSlide(slide.id, { alt: e.target.value })}
                  placeholder="Describe the image for screen readers"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                />
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-black text-[#ff7a1a] uppercase tracking-wide mb-4">Arabic Images</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Arabic Desktop Image</label>
                    <span className="text-[10px] text-gray-300 font-medium">Falls back to English desktop if empty</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={slide.srcAr ?? ''}
                        onChange={(e) => updateSlide(slide.id, { srcAr: e.target.value || undefined })}
                        placeholder="/assets/gather/ar-banner.webp"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
                      />
                      <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleUpload(f, slide.id, 'srcAr')
                        }} />
                      </label>
                    </div>
                    <ImagePreviewBox src={slide.srcAr ?? ''} label="Preview" aspectRatio="video" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500">Arabic Mobile Image</label>
                    <span className="text-[10px] text-gray-300 font-medium">Falls back to English mobile if empty</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={slide.mobileSrcAr ?? ''}
                        onChange={(e) => updateSlide(slide.id, { mobileSrcAr: e.target.value || undefined })}
                        placeholder="/assets/gather/ar-mobile-banner.webp"
                        className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
                      />
                      <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                        Upload
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) handleUpload(f, slide.id, 'mobileSrcAr')
                        }} />
                      </label>
                    </div>
                    <ImagePreviewBox src={slide.mobileSrcAr ?? ''} label="Preview" aspectRatio="portrait" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  )
}

function HeroTextEditor({ heroText, onChange }: { heroText: HeroText; onChange: (h: HeroText) => void }) {
  const update = (field: keyof HeroText, value: string) => {
    onChange({ ...heroText, [field]: value })
  }

  return (
    <div className="space-y-5">
      <SectionPanel title="Hero Text Overlay" description="The text displayed over the hero banner slides. Keep it short and impactful.">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Brand Line" value={heroText.brandLine} onChange={(v) => update('brandLine', v)} hint="Large brand name (e.g. Gather)" />
            <Field label="Headline" value={heroText.headline} onChange={(v) => update('headline', v)} hint="Main headline text" />
          </div>
          <Field label="Subtitle" value={heroText.subtitle} onChange={(v) => update('subtitle', v)} hint="Short description below headline" />
        </div>
      </SectionPanel>

      <SectionPanel title="Call-to-Action Buttons" description="Two buttons shown below the hero text.">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FE7501] flex items-center justify-center text-white text-xs font-bold">1</div>
              <p className="text-sm font-bold text-gray-700">Primary Button</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
              <Field label="Label" value={heroText.ctaPrimaryLabel} onChange={(v) => update('ctaPrimaryLabel', v)} />
              <Field label="Link URL" value={heroText.ctaPrimaryUrl} onChange={(v) => update('ctaPrimaryUrl', v)} hint="e.g. #featured-gifts or /shop" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md border-2 border-[#FE7501] bg-white flex items-center justify-center text-[#FE7501] text-xs font-bold">2</div>
              <p className="text-sm font-bold text-gray-700">Secondary Button</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
              <Field label="Label" value={heroText.ctaSecondaryLabel} onChange={(v) => update('ctaSecondaryLabel', v)} />
              <Field label="Link URL" value={heroText.ctaSecondaryUrl} onChange={(v) => update('ctaSecondaryUrl', v)} hint="e.g. #shop-by-occasion or /shop-by-occasion" />
            </div>
          </div>
        </div>
      </SectionPanel>
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
    <div className="space-y-5">
      <SectionPanel title="About Gather — Text Content" description="The center column text in the About Gather section.">
        <div className="space-y-4">
          <Field label="Title" value={about.title} onChange={(v) => update('title', v)} hint='The word "Gather" will be highlighted in orange' />
          <Field label="Subtitle" value={about.subtitle} onChange={(v) => update('subtitle', v)} />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Body Text</label>
            <textarea
              value={about.body}
              onChange={(e) => update('body', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Button Text" value={about.ctaText} onChange={(v) => update('ctaText', v)} />
            <Field label="Button URL" value={about.ctaUrl} onChange={(v) => update('ctaUrl', v)} />
          </div>
        </div>
      </SectionPanel>

      <SectionPanel title="About Gather — Side Media" description="The two images/GIFs shown on the left and right sides of the text. Supports GIF, PNG, WebP.">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FCECDC] flex items-center justify-center text-[#ff7a1a] text-xs font-bold">L</div>
              <p className="text-sm font-bold text-gray-700">Left Media</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={about.leftImage}
                onChange={(e) => update('leftImage', e.target.value)}
                placeholder="/assets/gather/about/image.gif"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
              />
              <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                Upload
                <input type="file" accept="image/*,.gif" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 'leftImage')
                }} />
              </label>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#FCECDC] overflow-hidden flex items-center justify-center h-48">
              {about.leftImage ? (
                <img src={about.leftImage} alt="Left media preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-gray-400 font-medium">No image set</p>
              )}
            </div>
            {about.leftImage && (
              <p className="text-xs text-gray-400 font-mono truncate" title={about.leftImage}>{about.leftImage}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FCECDC] flex items-center justify-center text-[#ff7a1a] text-xs font-bold">R</div>
              <p className="text-sm font-bold text-gray-700">Right Media</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={about.rightImage}
                onChange={(e) => update('rightImage', e.target.value)}
                placeholder="/assets/gather/about/image.gif"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a] truncate"
              />
              <label className="px-3 py-2 rounded-xl bg-gray-100 text-xs font-bold text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors shrink-0">
                Upload
                <input type="file" accept="image/*,.gif" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f, 'rightImage')
                }} />
              </label>
            </div>
            <div className="rounded-xl border border-gray-200 bg-[#FCECDC] overflow-hidden flex items-center justify-center h-48">
              {about.rightImage ? (
                <img src={about.rightImage} alt="Right media preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <p className="text-xs text-gray-400 font-medium">No image set</p>
              )}
            </div>
            {about.rightImage && (
              <p className="text-xs text-gray-400 font-mono truncate" title={about.rightImage}>{about.rightImage}</p>
            )}
          </div>
        </div>
      </SectionPanel>
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

  const cardIcons = ['⭐', '🚚', '🔒']

  return (
    <div className="space-y-5">
      <SectionPanel title="Why Gather — Feature Cards" description="The 3 feature cards shown below the About section. Each card has an icon, title, and description.">
        <div className="space-y-4">
          {sorted.map((card, idx) => (
            <div key={card.id} className="rounded-xl border border-gray-200 p-4 space-y-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#fff4e8] flex items-center justify-center text-lg shrink-0">
                    {cardIcons[idx] || '⭐'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Card {idx + 1}</p>
                    <p className="text-xs text-gray-400">Position {idx + 1} of {sorted.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => moveCard(card.id, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400" title="Move up">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveCard(card.id, 1)} disabled={idx === sorted.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 text-gray-400" title="Move down">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>
              <div className="space-y-3 pl-13">
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
              </div>
            </div>
          ))}
        </div>
      </SectionPanel>
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
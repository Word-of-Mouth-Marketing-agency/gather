'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { ContactPageContent, ContactSocialLinks } from '@/types'

export default function AdminContactEditorPage() {
  const [content, setContent] = useState<ContactPageContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    fetch('/api/pages/contact')
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
      const res = await fetch('/api/pages/contact', {
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
          <h1 className="text-2xl font-black text-gray-900">Contact Page Editor</h1>
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
          <h1 className="text-2xl font-black text-gray-900">Contact Page Editor</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-semibold">Failed to load contact page content</p>
        </div>
      </div>
    )
  }

  const updateSocial = (field: keyof ContactSocialLinks, value: string) => {
    setContent({ ...content, socialLinks: { ...content.socialLinks, [field]: value } })
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
            <h1 className="text-2xl font-black text-gray-900">Contact Page Editor</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage contact page content and social links</p>
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

      <SectionPanel title="Page Settings" description="General settings for the Contact page.">
        <Field label="Page Title" value={content.pageTitle} onChange={(v) => setContent({ ...content, pageTitle: v })} hint='Shown in the page title banner. The accent word will be highlighted.' />
      </SectionPanel>

      <SectionPanel title="Contact Info Section" description="The left column with title, description, and social media links.">
        <div className="space-y-4">
          <Field label="Info Title" value={content.infoTitle} onChange={(v) => setContent({ ...content, infoTitle: v })} hint="Heading shown next to the contact form" />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500">Info Body Text</label>
            <textarea
              value={content.infoBody}
              onChange={(e) => setContent({ ...content, infoBody: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
            />
          </div>
        </div>
      </SectionPanel>

      <SectionPanel title="Contact Form" description="Settings for the contact form on the right side.">
        <div className="space-y-4">
          <Field label="Form Title" value={content.formTitle} onChange={(v) => setContent({ ...content, formTitle: v })} hint="Heading shown above the contact form" />
          <Field label="Recipient Email" value={content.recipientEmail} onChange={(v) => setContent({ ...content, recipientEmail: v })} hint="Email address where contact form submissions will be sent (future email integration)" />
        </div>
      </SectionPanel>

      <SectionPanel title="Social Media Links" description="URLs for social media icons displayed on the contact page.">
        <div className="space-y-4">
          <SocialField
            label="Facebook"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            }
            value={content.socialLinks.facebook}
            onChange={(v) => updateSocial('facebook', v)}
          />
          <SocialField
            label="Instagram"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
              </svg>
            }
            value={content.socialLinks.instagram}
            onChange={(v) => updateSocial('instagram', v)}
          />
          <SocialField
            label="TikTok"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.52 2.89 2.89 0 0 1 0-5.78 2.9 2.9 0 0 1 1.2.26V9.03a6.33 6.33 0 0 0-.33-.06 6.33 6.33 0 0 0-5.49 9.32 6.33 6.33 0 0 0 11.04-3.79V10.9a8.2 8.2 0 0 0 4.68 1.56v-3.4a4.84 4.84 0 0 1-1.2-.37z" />
              </svg>
            }
            value={content.socialLinks.tiktok}
            onChange={(v) => updateSocial('tiktok', v)}
          />
          <SocialField
            label="YouTube"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
              </svg>
            }
            value={content.socialLinks.youtube}
            onChange={(v) => updateSocial('youtube', v)}
          />
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

function SocialField({ label, icon, value, onChange }: { label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#ff7a1a] flex items-center justify-center text-white shrink-0">
          {icon}
        </div>
        <label className="text-xs font-bold text-gray-500">{label}</label>
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`https://${label.toLowerCase()}.com/yourpage`}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-[#ff7a1a]"
      />
    </div>
  )
}
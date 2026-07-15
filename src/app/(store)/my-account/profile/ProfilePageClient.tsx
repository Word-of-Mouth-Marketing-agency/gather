'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCustomerSession, setCustomerSession } from '@/lib/customer-auth'
import PageTitleSection from '@/components/PageTitleSection'
import SignInPrompt from '@/components/SignInPrompt'
import { useLocale } from '@/components/LocaleProvider'

export default function ProfilePage() {
  const { locale, href, t } = useLocale()
  const session = useCustomerSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const initialized = useRef(false)

  useEffect(() => {
    if (!session || initialized.current) return
    initialized.current = true
    setName(session.name)
    setEmail(session.email)
    fetch(`/api/auth/customer?id=${encodeURIComponent(session.id)}`)
      .then((r) => r.json())
      .then((data) => { if (data.phone) setPhone(data.phone) })
      .catch(() => {})
  }, [session])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage('')
    setSaving(true)
    try {
      const res = await fetch(`/api/auth/customer?id=${encodeURIComponent(session!.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      })
      if (!res.ok) {
        const data = await res.json()
        setMessage(data.error || 'Failed to update')
        return
      }
      setCustomerSession({ ...session!, name, email })
      setMessage('Profile updated successfully!')
    } catch {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (!session) return <SignInPrompt />

  return (
    <>
      <PageTitleSection title={t('profile.title')} />
      <main className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6">
          <Link href={href('/my-account')} className="text-sm text-[#ff7a1a] font-semibold hover:underline">{t('orders.back')}</Link>
        </div>

        <div className="gather-section p-8 rounded-3xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && (
              <div className={`text-sm rounded-xl px-4 py-3 ${
                message.includes('successfully')
                  ? 'bg-green-50 border border-green-200 text-green-600'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('profile.fullName')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('profile.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('profile.phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {saving ? t('profile.saving') : t('profile.save')}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

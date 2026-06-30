'use client'

import { useState } from 'react'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'
import { useLocale } from '@/components/LocaleProvider'

export default function ForgotPasswordPage() {
  const { locale, href, t } = useLocale()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [devToken, setDevToken] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/customer/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setSent(true)
      if (data.devToken) setDevToken(data.devToken)
    } catch {
      setError(t('error.generic'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <PageTitleSection title={t('forgotPassword.title')} />
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="gather-section p-8 rounded-3xl text-center">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-lg font-black text-[#171717]">{t('forgotPassword.submit')}</h2>
            <p className="mt-2 text-sm text-[#7a6247]">
              {locale === 'ar'
                ? `إذا كان هناك حساب مرتبط بـ ${email}، سيصلك رابط إعادة تعيين كلمة المرور قريبًا.`
                : `If an account exists for ${email}, you will receive a password reset link shortly.`}
            </p>
            {devToken && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-left">
                <p className="text-xs font-semibold text-amber-800 mb-1">Dev: Reset Token</p>
                <p className="text-xs text-amber-700 break-all font-mono">{devToken}</p>
                <Link
                  href={href(`/reset-password?token=${devToken}`)}
                  className="mt-2 inline-block text-xs text-amber-700 font-semibold underline hover:text-amber-900"
                >
                  Open reset page
                </Link>
              </div>
            )}
            <Link href={href('/login')} className="mt-6 inline-block text-sm text-[#ff7a1a] font-semibold hover:underline">
              {t('common.back') + ' ' + t('login.title')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <PageTitleSection title={t('forgotPassword.title')} />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="gather-section p-8 rounded-3xl">
          <p className="text-sm text-[#7a6247] mb-6 text-center">
            {t('forgotPassword.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('forgotPassword.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="ahmed@example.com"
              />
            </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? t('forgotPassword.submitting') : t('forgotPassword.submit')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#7a6247]">
              <Link href={href('/login')} className="text-[#ff7a1a] font-semibold hover:underline">
                {t('common.back') + ' ' + t('login.title')}
              </Link>
            </p>
        </div>
      </main>
    </>
  )
}

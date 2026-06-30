'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'
import { setCustomerSession } from '@/lib/customer-auth'
import { useLocale } from '@/components/LocaleProvider'

export default function SignupPage() {
  const router = useRouter()
  const { href, t } = useLocale()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [acceptedDataPolicy, setAcceptedDataPolicy] = useState(false)
  const [acceptedTermsAndConditions, setAcceptedTermsAndConditions] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setFn(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError(t('signup.passwordMismatch'))
      return
    }

    if (form.password.length < 6) {
      setError(t('signup.passwordShort'))
      return
    }

    if (!acceptedDataPolicy || !acceptedTermsAndConditions) {
      setError(t('signup.acceptPolicies'))
      return
    }

    setLoading(true)

    try {
      const acceptedCustomerPoliciesAt = new Date().toISOString()
      const res = await fetch('/api/auth/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          acceptedDataPolicy,
          acceptedTermsAndConditions,
          acceptedCustomerPoliciesAt,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('signup.failed'))
        return
      }

      setCustomerSession(data)
      router.push('/my-account')
      router.refresh()
    } catch {
      setError(t('error.generic'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageTitleSection title={t('signup.title')} />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="gather-section p-8 rounded-3xl">
          <p className="text-sm text-[#7a6247] mb-6 text-center">
            {t('signup.subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('signup.fullName')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setFn('name', e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder={t('signup.namePlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('signup.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setFn('email', e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder={t('forgotPassword.placeholder')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('signup.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setFn('phone', e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder={t('checkout.phonePlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('signup.password')}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setFn('password', e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder={t('signup.passwordPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('signup.confirmPassword')}</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setFn('confirmPassword', e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder={t('signup.confirmPlaceholder')}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedDataPolicy}
                  onChange={(e) => setAcceptedDataPolicy(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40"
                />
                <span className="text-sm text-[#7a6247] leading-relaxed">
                  {t('signup.dataPolicy')}{' '}
                  <Link href={href('/data-policy')} className="text-[#ff7a1a] font-semibold hover:underline" target="_blank">
                    {t('signup.dataPolicyLink')}
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTermsAndConditions}
                  onChange={(e) => setAcceptedTermsAndConditions(e.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40"
                />
                <span className="text-sm text-[#7a6247] leading-relaxed">
                  {t('signup.termsAndConditions')}{' '}
                  <Link href={href('/terms-and-conditions')} className="text-[#ff7a1a] font-semibold hover:underline" target="_blank">
                    {t('signup.termsLink')}
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? t('signup.submitting') : t('signup.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#7a6247]">
            {t('signup.haveAccount')}{' '}
            <Link href={href('/login')} className="text-[#ff7a1a] font-semibold hover:underline">
              {t('signup.signIn')}
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

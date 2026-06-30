'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'
import { setCustomerSession } from '@/lib/customer-auth'
import { useLocale } from '@/components/LocaleProvider'

export default function LoginPage() {
  const router = useRouter()
  const { href, t } = useLocale()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t('login.failed'))
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
      <PageTitleSection title={t('login.title')} />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="gather-section p-8 rounded-3xl">
          <p className="text-sm text-[#7a6247] mb-6 text-center">
            {t('login.welcome')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('login.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="ahmed@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('login.password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder={t('login.password')}
              />
              <div className="text-right">
                <Link href={href('/forgot-password')} className="text-xs text-[#ff7a1a] font-medium hover:underline">
                  {t('login.forgotPassword')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? t('login.submitting') : t('login.submit')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#7a6247]">
            {t('login.noAccount')}{' '}
            <Link href={href('/signup')} className="text-[#ff7a1a] font-semibold hover:underline">
              {t('login.createOne')}
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

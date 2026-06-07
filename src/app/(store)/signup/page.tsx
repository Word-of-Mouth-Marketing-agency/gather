'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'
import { setCustomerSession } from '@/lib/customer-auth'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
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
      setError('Passwords do not match')
      return
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/customer/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Signup failed')
        return
      }

      setCustomerSession(data)
      router.push('/my-account')
      router.refresh()
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageTitleSection title="Create Account" />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="gather-section p-8 rounded-3xl">
          <p className="text-sm text-[#7a6247] mb-6 text-center">
            Create your Gather account to enjoy faster checkout and order tracking.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Full name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setFn('name', e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="Ahmed Hassan"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setFn('email', e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="ahmed@example.com"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Phone number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setFn('phone', e.target.value)}
                required
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="+20 10 0000 0000"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setFn('password', e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Confirm password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setFn('confirmPassword', e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="Repeat your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#7a6247]">
            Already have an account?{' '}
            <Link href="/login" className="text-[#ff7a1a] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </>
  )
}

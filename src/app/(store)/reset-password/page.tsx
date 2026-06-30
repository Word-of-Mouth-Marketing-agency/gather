'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/customer/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Reset failed')
        return
      }

      setDone(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <>
        <PageTitleSection title="Password Reset" />
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="gather-section p-8 rounded-3xl text-center">
            <div className="text-4xl mb-4">✅</div>
            <h2 className="text-lg font-black text-[#171717]">Password updated</h2>
            <p className="mt-2 text-sm text-[#7a6247]">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block py-3 px-8 rounded-full bg-[#ff7a1a] text-white font-black text-sm shadow-lg hover:bg-[#fe6c00] transition-colors"
            >
              Sign In
            </Link>
          </div>
        </main>
      </>
    )
  }

  if (!token) {
    return (
      <>
        <PageTitleSection title="Invalid Link" />
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="gather-section p-8 rounded-3xl text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-black text-[#171717]">Invalid reset link</h2>
            <p className="mt-2 text-sm text-[#7a6247]">
              This password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="mt-6 inline-block text-sm text-[#ff7a1a] font-semibold hover:underline">
              Request a new reset link
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <PageTitleSection title="Reset Password" />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="gather-section p-8 rounded-3xl">
          <p className="text-sm text-[#7a6247] mb-6 text-center">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full min-h-[50px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <>
        <PageTitleSection title="Reset Password" />
        <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="py-24 text-center"><div className="w-12 h-12 mx-auto rounded-full bg-gray-100 animate-pulse" /></div>
        </main>
      </>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

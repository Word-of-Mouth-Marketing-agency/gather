'use client'

import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'

export default function SignInPrompt() {
  return (
    <>
      <PageTitleSection title="My Account" />
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-black text-[#171717]">Sign in required</h2>
        <p className="text-sm text-[#7a6247] mt-2 mb-6">
          Please sign in to access your account.
        </p>
        <Link href="/login" className="inline-flex gather-btn-primary">
          Sign In
        </Link>
        <p className="mt-4 text-sm text-[#7a6247]">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-[#ff7a1a] font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </main>
    </>
  )
}

import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import PolicyContentRenderer from '@/components/PolicyContentRenderer'
import { getPrivacyPolicyContent } from '@/lib/data'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Gather privacy policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  const content = getPrivacyPolicyContent()

  return (
    <>
      <PageTitleSection title={content.pageTitle} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-[#7a6247] text-sm leading-relaxed space-y-4">
          <PolicyContentRenderer content={content.content} />
        </div>
      </main>
    </>
  )
}
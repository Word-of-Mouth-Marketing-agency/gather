import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import PolicyContentRenderer from '@/components/PolicyContentRenderer'
import { getRefundReturnsContent } from '@/lib/data'
import { getServerLocale } from '@/lib/locale-server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'سياسة الاسترجاع والاستبدال' : 'Refund and Returns Policy',
    description: isAr
      ? 'سياسة استرجاع واستبدال چزر — إلغاء الطلب، الاسترجاع، المنتجات التالفة، والمبالغ المستردة.'
      : 'Gather refund and returns policy — order cancellation, returns, damaged items, and refunds.',
  }
}

export default async function RefundReturnsPage() {
  const locale = await getServerLocale()
  const isAr = locale === 'ar'
  const content = getRefundReturnsContent()

  const pageTitle = isAr ? content.titleAr ?? content.pageTitle : content.pageTitle
  const bodyContent = isAr ? content.contentAr ?? content.content : content.content

  return (
    <>
      <PageTitleSection title={pageTitle} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-[#7a6247] text-sm leading-relaxed space-y-4">
          <PolicyContentRenderer content={bodyContent} />
        </div>
      </main>
    </>
  )
}

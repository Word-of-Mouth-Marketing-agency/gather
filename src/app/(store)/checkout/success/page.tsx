import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'
import { localeHref } from '@/lib/locale'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  return {
    title: t('meta.checkoutConfirmed', locale),
  }
}

export default async function CheckoutSuccessPage() {
  const locale = await getServerLocale()
  return (
    <>
      <PageTitleSection title={t('checkout.thankYou', locale)} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-3">{t('checkout.thankYou', locale)}</h1>
        <p className="text-[#7a6247] mb-8">
          {t('checkout.orderPlaced', locale)}
        </p>
        <a href={localeHref('/shop-by-category', locale)} className="inline-flex gather-btn-primary px-8 py-3.5">
          {t('cart.continueShopping', locale)}
        </a>
      </main>
    </>
  )
}

import type { Metadata } from 'next'
import CheckoutPageClient from '@/components/CheckoutPageClient'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  return {
    title: t('meta.checkout', locale),
  }
}

export default function CheckoutPage() {
  return <CheckoutPageClient />
}

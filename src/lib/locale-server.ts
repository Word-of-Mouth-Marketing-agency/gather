import 'server-only'
import { headers } from 'next/headers'
import type { Locale } from './translations'

const LOCALE_HEADER = 'x-gather-locale'

export async function getServerLocale(): Promise<Locale> {
  try {
    const h = await headers()
    const val = h.get(LOCALE_HEADER)
    if (val === 'ar') return 'ar'
    return 'en'
  } catch {
    return 'en'
  }
}

export async function getServerLocaleInfo(): Promise<{ locale: Locale; isRTL: boolean }> {
  const locale = await getServerLocale()
  return { locale, isRTL: locale === 'ar' }
}

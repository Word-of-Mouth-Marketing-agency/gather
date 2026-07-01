'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '@/lib/translations'
import { t as translate } from '@/lib/translations'
import { localeHref } from '@/lib/locale'

interface LocaleContextValue {
  locale: Locale
  isRTL: boolean
  href: (path: string) => string
  t: (key: string, values?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'en',
  isRTL: false,
  href: (p: string) => p,
  t: (k: string) => k,
})

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}

export function LocaleProvider({ children, initialLocale = 'en' }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale] = useState<Locale>(initialLocale)
  const value = useMemo(() => {
    const isRTL = locale === 'ar'
    return {
      locale,
      isRTL,
      href: (path: string) => localeHref(path, locale),
      t: (key: string, values?: Record<string, string | number>) => translate(key, locale, values),
    }
  }, [locale])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

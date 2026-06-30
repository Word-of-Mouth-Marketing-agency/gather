import type { Locale } from './translations'

const LOCALE_HEADER = 'x-gather-locale'

export function getClientLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  return window.location.pathname.startsWith('/ar') ? 'ar' : 'en'
}

export function isArabicPath(pathname: string): boolean {
  return pathname.startsWith('/ar')
}

export function arHref(path: string): string {
  const clean = path.replace(/^\/ar/, '') || '/'
  return `/ar${clean}`
}

export function enHref(path: string): string {
  return path.replace(/^\/ar/, '') || '/'
}

export function localeHref(path: string, locale: Locale): string {
  if (locale === 'ar') return arHref(path)
  return enHref(path)
}

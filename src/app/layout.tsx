import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gather-eg.com'

export async function generateMetadata(): Promise<Metadata> {
  let localeHeader = 'en'
  try {
    const h = await headers()
    localeHeader = h.get('x-gather-locale') || 'en'
  } catch { /* default to en */ }

  const isArabic = localeHeader === 'ar'

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: isArabic
        ? 'جاذر — هدايا فاخرة مع توصيل في القاهرة'
        : 'Gather — Premium Gifts Delivered in Cairo',
      template: isArabic ? '%s | جاذر' : '%s | Gather',
    },
    description: isArabic
      ? 'جاذر — منصة الهدايا الفاخرة في القاهرة. تسوق علب هدايا، ورود، شوكولاتة، والمزيد لكل المناسبات.'
      : "Gather — Cairo's premium gifting platform. Shop gift boxes, flowers, chocolates, and more for every occasion. Fast delivery available across Cairo.",
    icons: {
      icon: '/assets/gather/favicon.png',
    },
    openGraph: {
      title: isArabic
        ? 'جاذر — هدايا فاخرة مع توصيل في القاهرة'
        : 'Gather — Premium Gifts Delivered in Cairo',
      description: isArabic
        ? 'تسوق هدايا فاخرة لكل مناسبة. توصيل سريع في القاهرة.'
        : 'Shop premium gifts for every occasion. Fast delivery across Cairo.',
      url: 'https://gather-eg.com',
      siteName: 'Gather',
      locale: isArabic ? 'ar_EG' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/assets/gather/gather-logo.webp',
          width: 512,
          height: 512,
          alt: 'Gather',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: isArabic
        ? 'جاذر — هدايا فاخرة مع توصيل في القاهرة'
        : 'Gather — Premium Gifts Delivered in Cairo',
      description: isArabic
        ? 'تسوق هدايا فاخرة لكل مناسبة. توصيل سريع في القاهرة.'
        : 'Shop premium gifts for every occasion. Fast delivery across Cairo.',
      images: ['/assets/gather/gather-logo.webp'],
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let isArabic = false
  try {
    const h = await headers()
    isArabic = h.get('x-gather-locale') === 'ar'
  } catch { /* default to en */ }

  return (
    <html lang={isArabic ? 'ar' : 'en'} dir={isArabic ? 'rtl' : 'ltr'} className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

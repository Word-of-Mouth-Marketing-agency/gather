import type { Metadata } from 'next'
import './globals.css'

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gather-eg.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Gather — Premium Gifts Delivered in Cairo',
    template: '%s | Gather',
  },
  description:
    "Gather — Cairo's premium gifting platform. Shop gift boxes, flowers, chocolates, and more for every occasion. Fast delivery available across Cairo.",
  icons: {
    icon: '/assets/gather/favicon.png',
  },
  openGraph: {
    title: 'Gather — Premium Gifts Delivered in Cairo',
    description: 'Shop premium gifts for every occasion. Fast delivery across Cairo.',
    url: 'https://gather-eg.com',
    siteName: 'Gather',
    locale: 'en_US',
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
    title: 'Gather — Premium Gifts Delivered in Cairo',
    description: 'Shop premium gifts for every occasion. Fast delivery across Cairo.',
    images: ['/assets/gather/gather-logo.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Gather — Premium Gifts Delivered Same-Day in Cairo',
    template: '%s | Gather',
  },
  description:
    "Gather — Cairo's premium gifting platform. Shop gift boxes, flowers, chocolates, and more for every occasion. Same-day delivery available.",
  icons: {
    icon: '/assets/gather/favicon.png',
  },
  openGraph: {
    title: 'Gather — Premium Gifts Delivered Same-Day in Cairo',
    description: 'Shop premium gifts for every occasion. Same-day delivery across Cairo.',
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
    title: 'Gather — Premium Gifts Delivered Same-Day in Cairo',
    description: 'Shop premium gifts for every occasion. Same-day delivery across Cairo.',
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

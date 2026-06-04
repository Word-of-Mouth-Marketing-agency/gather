import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

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
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}

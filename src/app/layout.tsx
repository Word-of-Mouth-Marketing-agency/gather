import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

/*
TODO — Switch to Recoleta local font
1. Place font files in public/fonts/recoleta/ (see globals.css for required files).
2. Uncomment the localFont config below.
3. Remove the Inter import above.
4. Use recoleta.variable in the html className below.
*/

/*
import localFont from 'next/font/local'

const recoleta = localFont({
  src: [
    { path: '../../public/fonts/recoleta/Recoleta-Regular.woff2', weight: '400' },
    { path: '../../public/fonts/recoleta/Recoleta-Medium.woff2', weight: '500' },
    { path: '../../public/fonts/recoleta/Recoleta-SemiBold.woff2', weight: '600' },
    { path: '../../public/fonts/recoleta/Recoleta-Bold.woff2', weight: '700' },
    { path: '../../public/fonts/recoleta/Recoleta-Black.woff2', weight: '900' },
  ],
  variable: '--font-recoleta',
  display: 'swap',
})
*/

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
      <body className="min-h-full font-['Recoleta','Inter',system-ui,sans-serif]">{children}</body>
    </html>
  )
}

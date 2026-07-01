import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PreFooterSignupCTA from '@/components/layout/PreFooterSignupCTA'
import RabbitAssistant from '@/components/RabbitAssistant'
import RabbitPageTransition from '@/components/layout/RabbitPageTransition'
import { LocaleProvider } from '@/components/LocaleProvider'
import { getServerLocale } from '@/lib/locale-server'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const initialLocale = await getServerLocale()
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1">{children}</div>
        <PreFooterSignupCTA />
        <Footer />
        <RabbitAssistant />
        <Suspense fallback={null}>
          <RabbitPageTransition />
        </Suspense>
      </div>
    </LocaleProvider>
  )
}

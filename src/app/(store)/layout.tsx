import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PreFooterSignupCTA from '@/components/layout/PreFooterSignupCTA'
import RabbitAssistant from '@/components/RabbitAssistant'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">{children}</div>
      <PreFooterSignupCTA />
      <Footer />
      <RabbitAssistant />
    </div>
  )
}

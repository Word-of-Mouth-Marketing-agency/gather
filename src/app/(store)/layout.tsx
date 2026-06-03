import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 pt-16 lg:pt-20">{children}</div>
      <Footer />
    </div>
  )
}

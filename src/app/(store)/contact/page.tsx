import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import ContactInfo from '@/components/sections/ContactInfo'
import ContactForm from '@/components/sections/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Gather for orders, inquiries, or support.',
}

export default function ContactPage() {
  return (
    <main>
      <PageTitleSection title="Contact Us" accentWord="Us" />

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <ContactInfo />
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  )
}

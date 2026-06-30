import type { Metadata } from 'next'
import PageTitleSection from '@/components/PageTitleSection'
import ContactInfo from '@/components/sections/ContactInfo'
import ContactForm from '@/components/sections/ContactForm'
import { readJson } from '@/lib/db'
import type { ContactPageContent } from '@/types'
import { getServerLocale } from '@/lib/locale-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Gather for orders, inquiries, or support.',
}

export default async function ContactPage() {
  const locale = await getServerLocale()
  const content = readJson<ContactPageContent>('contact.json')
  const isAr = locale === 'ar'
  const accentWord = content.pageTitle.split(' ').pop() || 'Us'

  return (
    <main>
      <PageTitleSection title={isAr ? content.ar?.pageTitle ?? content.pageTitle : content.pageTitle} accentWord={accentWord} />

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <ContactInfo
              infoTitle={isAr ? content.ar?.infoTitle ?? content.infoTitle : content.infoTitle}
              infoBody={isAr ? content.ar?.infoBody ?? content.infoBody : content.infoBody}
              whatsappNumber={content.whatsappNumber}
              socialLinks={content.socialLinks}
            />
            <ContactForm
              formTitle={isAr ? content.ar?.formTitle ?? content.formTitle : content.formTitle}
              recipientEmail={content.recipientEmail}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

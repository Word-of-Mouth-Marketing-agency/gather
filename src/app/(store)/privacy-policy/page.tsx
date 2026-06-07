import type { Metadata } from 'next'
import Link from 'next/link'
import PageTitleSection from '@/components/PageTitleSection'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Gather privacy policy — how we collect, use, and protect your personal information.',
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageTitleSection title="Privacy Policy" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-[#7a6247] text-sm leading-relaxed space-y-8">
          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Introduction</h2>
            <p>
              Gather (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you visit our website gather-eg.com or use our services.
            </p>
            <p className="mt-3">
              By using our website and services, you agree to the collection and use of information
              in accordance with this policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Information We Collect</h2>
            <p>We collect the following types of information:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Personal Information:</strong> name, email address, phone number, delivery address, and payment information when you place an order or create an account.</li>
              <li><strong>Order Information:</strong> products purchased, order history, delivery preferences, and communication with our team.</li>
              <li><strong>Device &amp; Usage Information:</strong> IP address, browser type, pages visited, time spent on our site, and referring URLs.</li>
              <li><strong>Cookies:</strong> We use cookies and similar tracking technologies to improve your browsing experience and analyze site traffic.</li>
              <li><strong>User-Generated Content:</strong> photos and messages you submit through our Share Your Moment feature (with your consent).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Processing and fulfilling your orders, including delivery and payment.</li>
              <li>Communicating with you about your orders, account, and our services.</li>
              <li>Improving our website, products, and customer experience.</li>
              <li>Providing customer support and handling inquiries or complaints.</li>
              <li>Sending promotional offers and updates (only with your explicit consent).</li>
              <li>Complying with legal obligations and protecting our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Payment Information</h2>
            <p>
              Payment transactions are processed through secure third-party payment gateways.
              We do not store full credit card numbers or banking details on our servers.
              All payment data is encrypted and handled in compliance with PCI DSS standards.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Data Sharing &amp; Third Parties</h2>
            <p>We do not sell, trade, or rent your personal information to third parties.</p>
            <p className="mt-2">We may share your information with trusted third parties only as necessary to provide our services:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Delivery and logistics partners to fulfil your orders.</li>
              <li>Payment processors to handle transactions securely.</li>
              <li>Analytics providers (e.g., Vercel Analytics) to understand site usage.</li>
              <li>Law enforcement or regulatory bodies when required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or destruction.
              These include encryption, secure servers, access controls, and regular security reviews.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to fulfil the purposes
              described in this policy, or as required by law. Order records are retained for
              accounting and tax purposes for the period required by Egyptian law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Your Rights</h2>
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data, subject to legal obligations.</li>
              <li><strong>Objection:</strong> Object to the processing of your data for marketing purposes.</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured, machine-readable format.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at <Link href="mailto:info@gather-eg.com" className="text-[#ff7a1a] hover:underline">info@gather-eg.com</Link>.
              We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Cookies</h2>
            <p>
              Our website uses cookies to enhance your browsing experience. Cookies are small text
              files stored on your device that help us remember your preferences and understand how
              you interact with our site. You can control cookie settings through your browser preferences.
              Disabling cookies may affect some features of our website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly
              collect personal information from minors. If we become aware that a minor has provided
              us with personal data, we will take steps to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page
              with an updated &quot;Last updated&quot; date. We encourage you to review this policy periodically.
              Continued use of our services after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#171717] mb-3">Contact Us</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our
              data practices, please contact us:
            </p>
            <ul className="list-none mt-2 space-y-1">
              <li>Email: <Link href="mailto:info@gather-eg.com" className="text-[#ff7a1a] hover:underline">info@gather-eg.com</Link></li>
              <li>Phone: +20123456789</li>
              <li>Location: Cairo, Egypt</li>
            </ul>
          </section>

          <p className="text-xs text-gray-400 pt-4 border-t border-[#f1e2d3]">
            Last updated: June 2026
          </p>
        </div>
      </main>
    </>
  )
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Gather privacy policy.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl sm:text-4xl font-black text-[#171717] mb-6">Privacy Policy</h1>

      <div className="prose prose-stone max-w-none text-[#7a6247] space-y-4 text-sm leading-relaxed">
        <p>
          At Gather, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">Information We Collect</h2>
        <p>
          We collect information you provide when placing an order, creating an account, or contacting us: name, email, phone number, delivery address, and payment details.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">How We Use Your Information</h2>
        <p>
          We use your information to process orders, arrange delivery, communicate about your order, and improve our services. We do not sell or share your data with third parties for marketing purposes.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information. Payment transactions are encrypted and processed securely.
        </p>

        <h2 className="text-lg font-bold text-[#171717]">Contact</h2>
        <p>
          If you have questions about this policy, please contact us at info@gather-eg.com.
        </p>

        <p className="text-xs text-gray-400 pt-4">Last updated: June 2026</p>
      </div>
    </main>
  )
}

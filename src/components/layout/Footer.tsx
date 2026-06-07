import Link from 'next/link'

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/my-account', label: 'My account' },
  { href: '/contact', label: 'Contact' },
]

const usefulLinks = [
  { href: '/shop-by-occasion', label: 'Shop by occasion' },
  { href: '/shop-by-category', label: 'Shop by category' },
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/refund_returns', label: 'Refund and Returns Policy' },
]

const socialLinks = [
  {
    href: 'https://facebook.com',
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    href: 'https://instagram.com',
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      </svg>
    ),
  },
  {
    href: 'https://tiktok.com',
    label: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.52 2.89 2.89 0 0 1 0-5.78 2.9 2.9 0 0 1 1.2.26V9.03a6.33 6.33 0 0 0-.33-.06 6.33 6.33 0 0 0-5.49 9.32 6.33 6.33 0 0 0 11.04-3.79V10.9a8.2 8.2 0 0 0 4.68 1.56v-3.4a4.84 4.84 0 0 1-1.2-.37z" />
      </svg>
    ),
  },
  {
    href: 'https://youtube.com',
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#fffaf3] border-t border-[rgba(255,122,26,0.22)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div>
            <img
              src="/assets/gather/gather-logo.webp"
              alt="Gather"
              className="h-20 w-auto"
            />
            <p className="mt-4 text-sm font-semibold text-[#7a6247] leading-relaxed">
              Everything your gathering needs.
            </p>
            <div className="flex items-center gap-2 mt-5">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-[rgba(255,122,26,0.22)] flex items-center justify-center text-[#7a6247] hover:bg-[#ff7a1a] hover:text-white hover:border-[#ff7a1a] transition-colors duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-base font-bold text-[#171717] mb-4">
              Quick links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-[#7a6247] hover:text-[#ff7a1a] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Useful links */}
          <div>
            <h3 className="text-base font-bold text-[#171717] mb-4">
              Useful links
            </h3>
            <ul className="space-y-2.5">
              {usefulLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-semibold text-[#7a6247] hover:text-[#ff7a1a] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3 className="text-base font-bold text-[#171717] mb-4">
              Contact info
            </h3>
            <ul className="space-y-2.5 text-sm font-semibold text-[#7a6247]">
              <li>+20123456789</li>
              <li>info@gather-eg.com</li>
              <li>Cairo, Egypt</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/20 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7a6247]">
          <span>&copy; 2026 Gather. All rights reserved.</span>
          <span>
            Powered by{' '}
            <a
              href="https://wordofmoutheg.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#7a6247] hover:underline"
            >
              WORD OF MOUTH
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

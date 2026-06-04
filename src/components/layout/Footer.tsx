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
    href: 'https://x.com',
    label: 'X Twitter',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
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
    <footer className="bg-[#fffaf3] border-t border-[rgba(255,122,26,0.22)] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div>
            <img
              src="/assets/gather/gather-logo.webp"
              alt="Gather"
              className="h-8 w-auto"
            />
            <p className="mt-4 text-sm text-[#7a6247] leading-relaxed">
              Your one-stop shop for party and gathering essentials. Making celebrations effortless since 2020.
            </p>
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
                    className="text-sm text-[#7a6247] hover:text-[#ff7a1a] transition-colors"
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
                    className="text-sm text-[#7a6247] hover:text-[#ff7a1a] transition-colors"
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
            <ul className="space-y-2.5 text-sm text-[#7a6247]">
              <li>+20123456789</li>
              <li>info@gather-eg.com</li>
              <li>Cairo, Egypt</li>
            </ul>
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
        </div>
      </div>

      <div className="border-t border-[rgba(255,122,26,0.15)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7a6247]">
          <span>&copy; 2026 Gather. All rights reserved.</span>
          <span>
            Powered by{' '}
            <a
              href="https://wordofmoutheg.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#ff7a1a] hover:underline"
            >
              WORD OF MOUTH
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

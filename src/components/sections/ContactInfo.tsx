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
    label: 'X / Twitter',
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

export default function ContactInfo() {
  return (
    <div>
      <h2 className="text-3xl sm:text-4xl font-black text-[#171717] leading-tight">
        Let&apos;s prepare your occasion
      </h2>
      <p className="mt-5 text-base sm:text-lg text-[#7a6247] leading-relaxed">
        Whether you are planning a birthday, engagement, family gathering,
        friends&rsquo; get-together, or even a work event, GATHER helps you find
        the essentials quickly and easily. From decorations and balloons to
        snacks, desserts, chocolates, drinks, and other celebration must-haves,
        we aim to make the preparation process smooth, enjoyable, and
        stress-free.
      </p>

      <div className="flex items-center gap-4 mt-8">
        {socialLinks.map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={s.label}
            className="w-11 h-11 rounded-full bg-[#ff7a1a] flex items-center justify-center text-white hover:bg-[#fe6c00] transition-colors duration-200"
          >
            {s.icon}
          </a>
        ))}
      </div>
    </div>
  )
}

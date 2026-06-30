import type { ContactSocialLinks } from '@/types'

interface Props {
  infoTitle: string
  infoBody: string
  whatsappNumber?: string
  socialLinks: ContactSocialLinks
}

const socialIcons: Record<string, React.ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.52 2.89 2.89 0 0 1 0-5.78 2.9 2.9 0 0 1 1.2.26V9.03a6.33 6.33 0 0 0-.33-.06 6.33 6.33 0 0 0-5.49 9.32 6.33 6.33 0 0 0 11.04-3.79V10.9a8.2 8.2 0 0 0 4.68 1.56v-3.4a4.84 4.84 0 0 1-1.2-.37z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12z" />
    </svg>
  ),
}

function whatsappHref(number?: string): string {
  const digits = (number ?? '').replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : ''
}

export default function ContactInfo({ infoTitle, infoBody, whatsappNumber, socialLinks }: Props) {
  const links = [
    { key: 'facebook', href: socialLinks.facebook, label: 'Facebook' },
    { key: 'instagram', href: socialLinks.instagram, label: 'Instagram' },
    { key: 'tiktok', href: socialLinks.tiktok, label: 'TikTok' },
    { key: 'youtube', href: socialLinks.youtube, label: 'YouTube' },
  ].filter((l) => l.href)
  const whatsappLink = whatsappHref(whatsappNumber)

  return (
    <div>
      <h2 className="text-3xl sm:text-4xl font-black text-[#171717] leading-tight">
        {infoTitle}
      </h2>
      <p className="mt-5 text-base sm:text-lg text-[#7a6247] leading-relaxed">
        {infoBody}
      </p>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#fff4e8] px-5 py-3 text-sm font-black text-[#171717] transition-colors hover:bg-[#ff7a1a] hover:text-white"
        >
          WhatsApp: {whatsappNumber}
        </a>
      )}

      {links.length > 0 && (
        <div className="flex items-center gap-4 mt-8">
          {links.map((s) => (
            <a
              key={s.key}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="w-11 h-11 rounded-full bg-[#ff7a1a] flex items-center justify-center text-white hover:bg-[#fe6c00] transition-colors duration-200"
            >
              {socialIcons[s.key]}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

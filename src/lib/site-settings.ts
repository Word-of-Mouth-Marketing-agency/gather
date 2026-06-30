import { readJson } from './db'
import type { ContactPageContent } from '@/types'

const FALLBACK_WHATSAPP = '201000000000'

export function getWhatsappNumber(): string {
  try {
    const contact = readJson<ContactPageContent>('contact.json')
    const digits = (contact.whatsappNumber ?? '').replace(/\D/g, '')
    return digits || FALLBACK_WHATSAPP
  } catch {
    return FALLBACK_WHATSAPP
  }
}

export function getWhatsappHref(): string {
  const digits = getWhatsappNumber()
  return `https://wa.me/${digits}`
}

export function getWhatsappMessageHref(message?: string): string {
  const digits = getWhatsappNumber()
  const text = message ?? 'Hi GATHER, I need help with my order.'
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

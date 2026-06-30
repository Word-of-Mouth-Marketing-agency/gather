import { NextResponse } from 'next/server'
import { getWhatsappHref, getWhatsappMessageHref } from '@/lib/site-settings'

export async function GET() {
  return NextResponse.json({
    whatsappHref: getWhatsappHref(),
    whatsappMessageHref: getWhatsappMessageHref(),
  })
}

import 'server-only'
import { cookies } from 'next/headers'
import { getAdminSessionSecret } from '@/lib/admin-session'

const CUSTOMER_COOKIE = 'gather_customer_token'
const CUSTOMER_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

export type CustomerSessionPayload = {
  id: string
  email: string
  name: string
  exp: number
}

function base64UrlEncode(value: string): string {
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return atob(normalized)
}

function bytesToBase64Url(bytes: ArrayBuffer): string {
  let binary = ''
  const array = new Uint8Array(bytes)
  for (const byte of array) binary += String.fromCharCode(byte)
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getAdminSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return bytesToBase64Url(signature)
}

export async function createCustomerSessionToken(
  customer: { id: string; email: string; name: string }
): Promise<string> {
  const payload = base64UrlEncode(
    JSON.stringify({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      exp: Date.now() + CUSTOMER_EXPIRY_MS,
    })
  )
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

export async function parseCustomerSessionToken(
  token: string
): Promise<CustomerSessionPayload | null> {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = await sign(payload)
  if (!timingSafeEqual(signature, expected)) return null

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as CustomerSessionPayload
    if (!parsed.id || !parsed.email || typeof parsed.exp !== 'number') return null
    if (parsed.exp < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

export async function getCustomerSessionCookie(): Promise<CustomerSessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(CUSTOMER_COOKIE)?.value
    if (!token) return null
    return parseCustomerSessionToken(token)
  } catch {
    return null
  }
}

export async function setCustomerSessionCookie(
  customer: { id: string; email: string; name: string }
): Promise<void> {
  const token = await createCustomerSessionToken(customer)
  const cookieStore = await cookies()
  cookieStore.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: Math.ceil(CUSTOMER_EXPIRY_MS / 1000),
  })
}

export async function clearCustomerSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.set(CUSTOMER_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  } catch {
    // ignore — can happen in streaming/RSC edge cases
  }
}

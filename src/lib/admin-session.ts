const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

type AdminSessionPayload = {
  email: string
  role: 'admin'
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

export function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SESSION_SECRET is required in production')
  }
  return 'dev-only-admin-session-secret'
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

export async function createAdminSessionToken(email: string): Promise<string> {
  const payload = base64UrlEncode(JSON.stringify({ email, role: 'admin', exp: Date.now() + SESSION_EXPIRY_MS }))
  const signature = await sign(payload)
  return `${payload}.${signature}`
}

export async function parseAdminSessionToken(token: string): Promise<AdminSessionPayload | null> {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expected = await sign(payload)
  if (!timingSafeEqual(signature, expected)) return null

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as AdminSessionPayload
    if (!parsed.email || typeof parsed.exp !== 'number') return null
    if (parsed.exp < Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

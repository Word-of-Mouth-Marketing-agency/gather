import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL_MS = 60_000

let lastCleanup = Date.now()
function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const DEFAULTS: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 }

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((s) => s.trim()).filter(Boolean)
    const last = ips[ips.length - 1]
    if (last) return last
  }
  return '127.0.0.1'
}

export function rateLimit(
  request: Request,
  config: Partial<RateLimitConfig> = {},
): { ok: true } | { ok: false; response: NextResponse } {
  cleanup()
  const { windowMs, maxRequests } = { ...DEFAULTS, ...config }
  const ip = getClientIp(request)
  const now = Date.now()
  const key = `${ip}:${windowMs}:${maxRequests}`

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Too many requests. Try again in ${retryAfter} seconds.` },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      ),
    }
  }

  entry.count++
  return { ok: true }
}

export function rateLimitByKey(
  key: string,
  config: Partial<RateLimitConfig> = {},
): { ok: true } | { ok: false } {
  cleanup()
  const { windowMs, maxRequests } = { ...DEFAULTS, ...config }
  const now = Date.now()

  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (entry.count >= maxRequests) {
    return { ok: false }
  }

  entry.count++
  return { ok: true }
}

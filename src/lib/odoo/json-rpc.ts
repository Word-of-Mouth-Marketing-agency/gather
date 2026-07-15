import type { OdooOrmResult } from './types'

export interface OdooConfig {
  url: string
  db: string
  username: string
  password: string
}

function sanitizeOdooError(body: { error?: { message?: string; data?: { message?: string } } }, fallback: string): string {
  if (!body.error) return fallback
  const msg = body.error.data?.message ?? body.error.message
  if (msg && typeof msg === 'string') {
    const lines = msg.split('\n')
    return lines[0].trim().slice(0, 300)
  }
  return fallback
}

export function getAllowedOdooHosts(): string[] {
  const raw = process.env.ALLOWED_ODOO_HOSTS || 'localhost,127.0.0.1,::1,host.docker.internal'
  return raw.split(',').map((h) => h.trim()).filter(Boolean)
}

function isAllowedOdooUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return getAllowedOdooHosts().includes(parsed.hostname)
  } catch {
    return false
  }
}

export function isOdooSyncEnabled(): boolean {
  return process.env.ODOO_SYNC_ENABLED === 'true'
}

export function getOdooConfig(): OdooConfig | null {
  const rawUrl = process.env.ODOO_URL
  const db = process.env.ODOO_DB
  const username = process.env.ODOO_USERNAME
  const password = process.env.ODOO_PASSWORD ?? process.env.ODOO_API_KEY
  if (!rawUrl || !db || !username || !password) return null
  const url = rawUrl.replace(/\/+$/, '')
  if (!isAllowedOdooUrl(url)) {
    throw new Error(
      `Odoo URL "${rawUrl}" host is not allowed. Set ALLOWED_ODOO_HOSTS to include "${new URL(url).hostname}".`,
    )
  }
  return { url, db, username, password }
}

function getOdooTimeoutMs(): number {
  const raw = process.env.ODOO_REQUEST_TIMEOUT_MS
  if (raw) {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n > 0) return n
  }
  return 15000
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number }): Promise<Response> {
  const timeout = options.timeout ?? getOdooTimeoutMs()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

let uidCache: number | null = null

async function authenticate(config: OdooConfig): Promise<number> {
  if (uidCache) return uidCache
  const res = await fetchWithTimeout(`${config.url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      id: 1,
      params: {
        service: 'common',
        method: 'authenticate',
        args: [config.db, config.username, config.password, {}],
      },
    }),
  })
  const body = await res.json()
  if (body.error) {
    throw new Error(`Odoo auth failed: ${sanitizeOdooError(body, 'see server logs')}`)
  }
  uidCache = body.result as number
  if (!uidCache) {
    throw new Error('Odoo auth returned invalid uid')
  }
  return uidCache
}

const DOMAIN_PREFIXES = new Set(['|', '&', '!'])

function requireDomain(domain: unknown, label: string): void {
  if (!Array.isArray(domain)) {
    throw new Error(`Odoo ${label}: domain must be an array, got ${typeof domain}`)
  }
  if (domain.length === 0) return
  if (Array.isArray(domain[0])) return
  if (domain.length >= 2 && DOMAIN_PREFIXES.has(domain[0] as string)) {
    for (let i = 1; i < domain.length; i++) {
      if (!Array.isArray(domain[i])) {
        throw new Error(
          `Odoo ${label}: domain with prefix operator "${domain[0]}" requires nested condition arrays, ` +
          `got flat element at index ${i}: ${String(domain[i])}`,
        )
      }
    }
    return
  }
  throw new Error(
    `Odoo ${label}: domain must be an array of conditions (e.g. [["field", "=", value]]), ` +
    `got flat array [${domain.join(', ')}]. Each condition must be a nested array.`,
  )
}

export async function odooExecuteKw<T = unknown>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const config = getOdooConfig()
  if (!config) throw new Error('Odoo env vars not configured')

  const uid = await authenticate(config)
  const res = await fetchWithTimeout(`${config.url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      id: Date.now(),
      params: {
        service: 'object',
        method: 'execute_kw',
        args: [config.db, uid, config.password, model, method, args],
        kwargs,
      },
    }),
  })
  const body = await res.json()
  if (body.error) {
    // Sanitize args for logging: redact large binary fields (image_1920, etc.)
    const sanitizedArgs = args.map((a) => {
      if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
        const copy = { ...(a as Record<string, unknown>) }
        for (const k of Object.keys(copy)) {
          if (typeof copy[k] === 'string' && (copy[k] as string).length > 500) copy[k] = `<truncated ${(copy[k] as string).length}b>`
        }
        return copy
      }
      return a
    })
    const errDetail = body.error?.data?.message ?? body.error?.message ?? 'no detail'
    console.log(
      `[ODOO_RPC_ERROR] model=${model} method=${method}` +
      ` args=${JSON.stringify(sanitizedArgs).slice(0, 600)}` +
      ` kwargs=${JSON.stringify(kwargs).slice(0, 200)}` +
      ` error=${String(errDetail).slice(0, 500)}`,
    )
    throw new Error(`Odoo ${model}.${method} failed: ${sanitizeOdooError(body, 'see server logs')}`)
  }
  return body.result as T
}

export async function odooSearchRead<T = OdooOrmResult>(
  model: string,
  domain: unknown[],
  fields: string[],
  limit?: number,
  opts?: { context?: Record<string, unknown> },
): Promise<T[]> {
  requireDomain(domain, `${model}.search_read`)
  const kwargs: Record<string, unknown> = { fields, limit: limit ?? false }
  if (opts?.context) kwargs.context = opts.context
  return odooExecuteKw<T[]>(model, 'search_read', [domain], kwargs)
}

export async function odooSearch(
  model: string,
  domain: unknown[],
  limit?: number,
): Promise<number[]> {
  requireDomain(domain, `${model}.search`)
  return odooExecuteKw<number[]>(model, 'search', [domain], { limit: limit ?? false })
}

export async function odooCreate(model: string, values: Record<string, unknown>): Promise<number> {
  return odooExecuteKw<number>(model, 'create', [values], { context: { gather_sync_origin: 'website' } })
}

export async function odooWrite(model: string, id: number, values: Record<string, unknown>): Promise<boolean> {
  return odooExecuteKw<boolean>(model, 'write', [[id], values], { context: { gather_sync_origin: 'website' } })
}

export function resetOdooAuthCache(): void {
  uidCache = null
}

// ─── Webhook Cooldown (defense-in-depth loop prevention) ──────────────────

const webhookCooldown = new Map<string, number>()
const WEBHOOK_COOLDOWN_MS = 5000

export function setWebhookCooldown(sku: string): void {
  webhookCooldown.set(sku.toUpperCase(), Date.now())
}

export function isWebhookOnCooldown(sku: string): boolean {
  const last = webhookCooldown.get(sku.toUpperCase())
  return last !== undefined && (Date.now() - last) < WEBHOOK_COOLDOWN_MS
}

// ─── Structured Sync Logger ────────────────────────────────────────────────

export interface SyncLogEntry {
  timestamp: string
  direction: 'push' | 'pull'
  entity: 'product' | 'category' | 'order' | 'customer' | 'stock'
  localId: string
  odooId?: number
  sku?: string
  operation: string
  durationMs: number
  result: 'success' | 'skipped' | 'failed'
  error?: string
}

export function logSync(entry: Omit<SyncLogEntry, 'timestamp'>): void {
  const log: SyncLogEntry = { timestamp: new Date().toISOString(), ...entry }
  const line = [
    '[ODOO_SYNC]',
    log.direction,
    log.entity,
    `local=${log.localId}`,
    log.odooId ? `odoo=${log.odooId}` : '',
    log.sku ? `sku=${log.sku}` : '',
    log.operation,
    `${log.durationMs}ms`,
    log.result,
    log.error ? `error=${log.error.slice(0, 200)}` : '',
  ].filter(Boolean).join(' ')
  console.log(line)
}

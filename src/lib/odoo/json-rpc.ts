import type { OdooOrmResult } from './types'

export interface OdooConfig {
  url: string
  db: string
  username: string
  password: string
}

export function getOdooConfig(): OdooConfig | null {
  const url = process.env.ODOO_URL
  const db = process.env.ODOO_DB
  const username = process.env.ODOO_USERNAME
  const password = process.env.ODOO_PASSWORD ?? process.env.ODOO_API_KEY
  if (!url || !db || !username || !password) return null
  return { url: url.replace(/\/+$/, ''), db, username, password }
}

let uidCache: number | null = null

async function authenticate(config: OdooConfig): Promise<number> {
  if (uidCache) return uidCache
  const res = await fetch(`${config.url}/jsonrpc`, {
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
    throw new Error(`Odoo auth failed: ${body.error.message ?? JSON.stringify(body.error)}`)
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
  const res = await fetch(`${config.url}/jsonrpc`, {
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
    const detail = body.error.data?.message ?? body.error.message ?? JSON.stringify(body.error)
    throw new Error(`Odoo ${model}.${method} failed: ${detail}`)
  }
  return body.result as T
}

export async function odooSearchRead<T = OdooOrmResult>(
  model: string,
  domain: unknown[],
  fields: string[],
  limit?: number,
): Promise<T[]> {
  requireDomain(domain, `${model}.search_read`)
  return odooExecuteKw<T[]>(model, 'search_read', [domain], { fields, limit: limit ?? false })
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
  return odooExecuteKw<number>(model, 'create', [values])
}

export async function odooWrite(model: string, id: number, values: Record<string, unknown>): Promise<boolean> {
  return odooExecuteKw<boolean>(model, 'write', [[id], values])
}

export function resetOdooAuthCache(): void {
  uidCache = null
}

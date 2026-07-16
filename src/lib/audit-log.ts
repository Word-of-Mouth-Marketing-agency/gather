import { readJson, writeJson, generateId } from './db'

const AUDIT_LOG_FILE = 'admin-audit-log.json'

export interface AuditEntry {
  id: string
  adminUserId: string
  adminEmail: string
  adminRole: string
  action: string
  targetType: string
  targetId?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

function now(): string {
  return new Date().toISOString()
}

function getLog(): AuditEntry[] {
  try {
    return readJson<AuditEntry[]>(AUDIT_LOG_FILE)
  } catch {
    return []
  }
}

async function saveLog(data: AuditEntry[]): Promise<void> {
  while (data.length > 10000) {
    data.shift()
  }
  await writeJson(AUDIT_LOG_FILE, data)
}

export async function recordAuditEvent(event: {
  adminUserId: string
  adminEmail: string
  adminRole: string
  action: string
  targetType: string
  targetId?: string
  metadata?: Record<string, unknown>
}): Promise<void> {
  const entry: AuditEntry = {
    id: generateId('audit'),
    ...event,
    timestamp: now(),
  }
  const log = getLog()
  log.unshift(entry)
  await saveLog(log)
}

export function getAuditLog(options?: {
  limit?: number
  offset?: number
  adminUserId?: string
  action?: string
  targetType?: string
}): AuditEntry[] {
  let log = getLog()

  if (options?.adminUserId) {
    log = log.filter((e) => e.adminUserId === options.adminUserId)
  }
  if (options?.action) {
    log = log.filter((e) => e.action === options.action)
  }
  if (options?.targetType) {
    log = log.filter((e) => e.targetType === options.targetType)
  }

  const offset = options?.offset ?? 0
  const limit = options?.limit ?? 200
  return log.slice(offset, offset + limit)
}

export function clearAuditLog(): Promise<void> {
  return saveLog([])
}

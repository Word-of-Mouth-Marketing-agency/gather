import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const lastValidJson = new Map<string, string>()

// ─── Sync lock for standalone writeJson callers ───────────────────────
const syncLocks = new Set<string>()

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function acquireSyncLock(filename: string): void {
  while (syncLocks.has(filename)) sleepMs(10)
  syncLocks.add(filename)
  logJsonFile('sync_lock', filename)
}

function releaseSyncLock(filename: string): void {
  syncLocks.delete(filename)
  logJsonFile('sync_unlock', filename)
}

// ─── Async mutex for withLock callers ─────────────────────────────────
interface Waiter {
  resolve: () => void
  next: Waiter | null
}

const asyncQueues = new Map<string, { head: Waiter | null; tail: Waiter | null }>()

function logJsonFile(event: string, filename: string, detail?: string): void {
  console.info(`[JSON_FILE] file=${filename} operation=${event}${detail ? ` ${detail}` : ''}`)
}

// ─── File helpers ─────────────────────────────────────────────────────
function dataPath(filename: string): string {
  return path.join(DATA_DIR, filename)
}

function parseJson<T>(filename: string, raw: string): T {
  const parsed = JSON.parse(raw) as T
  lastValidJson.set(filename, raw)
  return parsed
}

function atomicWrite(filename: string, data: unknown): void {
  const filePath = dataPath(filename)
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  const payload = `${JSON.stringify(data, null, 2)}\n`

  const fd = fs.openSync(tempPath, 'w')
  try {
    fs.writeFileSync(fd, payload, 'utf-8')
    fs.fsyncSync(fd)
  } finally {
    fs.closeSync(fd)
  }
  fs.renameSync(tempPath, filePath)
  lastValidJson.set(filename, payload)
  logJsonFile('write_success', filename, `bytes=${payload.length}`)
}

// ─── Public API ───────────────────────────────────────────────────────

export function acquireLock(filename: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const entry: Waiter = { resolve, next: null }
    const q = asyncQueues.get(filename)
    if (!q) {
      asyncQueues.set(filename, { head: entry, tail: entry })
      resolve()
    } else {
      q.tail!.next = entry
      q.tail = entry
    }
  })
}

export function releaseLock(filename: string): void {
  const q = asyncQueues.get(filename)
  if (!q || !q.head) { asyncQueues.delete(filename); return }
  const done = q.head
  if (done.next) {
    q.head = done.next
    done.next.resolve()
  } else {
    asyncQueues.delete(filename)
  }
  logJsonFile('async_unlock', filename)
}

export async function withLock<T>(filename: string, fn: () => Promise<T> | T): Promise<T> {
  await acquireLock(filename)
  try {
    return await fn()
  } finally {
    releaseLock(filename)
  }
}

export function readJson<T>(filename: string): T {
  const filePath = dataPath(filename)
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      if (!raw.trim()) throw new SyntaxError('JSON file is empty')
      return parseJson<T>(filename, raw)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logJsonFile('read_error', filename, `attempt=${attempt} error="${message.slice(0, 160)}"`)
      if (attempt === 1) continue
      const cached = lastValidJson.get(filename)
      if (cached) return parseJson<T>(filename, cached)
      throw new Error(`Failed to read ${filename}: ${message}`)
    }
  }
  throw new Error(`Failed to read ${filename}`)
}

export function writeJson<T>(filename: string, data: T): void {
  acquireSyncLock(filename)
  try {
    atomicWrite(filename, data)
  } catch (error) {
    const tempPath = `${dataPath(filename)}.${process.pid}.${Date.now()}.tmp`
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath) } catch { }
    const message = error instanceof Error ? error.message : String(error)
    logJsonFile('write_error', filename, `error="${message.slice(0, 160)}"`)
    throw error
  } finally {
    releaseSyncLock(filename)
  }
}

export function writeJsonUnlocked<T>(filename: string, data: T): void {
  try {
    atomicWrite(filename, data)
  } catch (error) {
    const tempPath = `${dataPath(filename)}.${process.pid}.${Date.now()}.tmp`
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath) } catch { }
    const message = error instanceof Error ? error.message : String(error)
    logJsonFile('write_error', filename, `error="${message.slice(0, 160)}"`)
    throw error
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

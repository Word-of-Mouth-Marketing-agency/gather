import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const lastValidJson = new Map<string, string>()

interface Waiter {
  resolve: () => void
  next: Waiter | null
}

const queues = new Map<string, { head: Waiter | null; tail: Waiter | null }>()

function log(event: string, filename: string, detail?: string): void {
  console.info(`[JSON] file=${filename} ${event}${detail ? ` ${detail}` : ''}`)
}

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
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
  const payload = `${JSON.stringify(data, null, 2)}\n`
  const fd = fs.openSync(tmp, 'w')
  try {
    fs.writeFileSync(fd, payload, 'utf-8')
    fs.fsyncSync(fd)
  } finally {
    fs.closeSync(fd)
  }
  fs.renameSync(tmp, filePath)
  lastValidJson.set(filename, payload)
  log('write', filename, `bytes=${payload.length}`)
}

export function acquireLock(filename: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const entry: Waiter = { resolve, next: null }
    const q = queues.get(filename)
    if (!q) {
      queues.set(filename, { head: entry, tail: entry })
      resolve()
    } else {
      q.tail!.next = entry
      q.tail = entry
    }
  })
}

export function releaseLock(filename: string): void {
  const q = queues.get(filename)
  if (!q || !q.head) { queues.delete(filename); return }
  const done = q.head
  if (done.next) {
    q.head = done.next
    done.next.resolve()
  } else {
    queues.delete(filename)
  }
  log('unlock', filename)
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
      const msg = error instanceof Error ? error.message : String(error)
      log('read_error', filename, `attempt=${attempt} error="${msg.slice(0, 160)}"`)
      if (attempt === 1) continue
      const cached = lastValidJson.get(filename)
      if (cached) return parseJson<T>(filename, cached)
      throw new Error(`Failed to read ${filename}: ${msg}`)
    }
  }
  throw new Error(`Failed to read ${filename}`)
}

export async function writeJson<T>(filename: string, data: T): Promise<void> {
  await acquireLock(filename)
  try {
    atomicWrite(filename, data)
  } catch (error) {
    const tmp = `${dataPath(filename)}.${process.pid}.${Date.now()}.tmp`
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch { }
    const msg = error instanceof Error ? error.message : String(error)
    log('write_error', filename, `error="${msg.slice(0, 160)}"`)
    throw error
  } finally {
    releaseLock(filename)
  }
}

export function writeJsonUnlocked<T>(filename: string, data: T): void {
  try {
    atomicWrite(filename, data)
  } catch (error) {
    const tmp = `${dataPath(filename)}.${process.pid}.${Date.now()}.tmp`
    try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch { }
    const msg = error instanceof Error ? error.message : String(error)
    log('write_error', filename, `error="${msg.slice(0, 160)}"`)
    throw error
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

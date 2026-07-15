import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')
const writeLocks = new Set<string>()
const lastValidJson = new Map<string, string>()

function sleepMs(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function dataPath(filename: string): string {
  return path.join(DATA_DIR, filename)
}

function logJsonFile(event: string, filename: string, detail?: string): void {
  console.info(`[JSON_FILE] file=${filename} operation=${event}${detail ? ` ${detail}` : ''}`)
}

function parseJson<T>(filename: string, raw: string): T {
  const parsed = JSON.parse(raw) as T
  lastValidJson.set(filename, raw)
  return parsed
}

export function acquireLock(filename: string): void {
  while (writeLocks.has(filename)) {
    sleepMs(10)
  }
  writeLocks.add(filename)
  logJsonFile('lock_acquired', filename)
}

export function releaseLock(filename: string): void {
  writeLocks.delete(filename)
  logJsonFile('lock_released', filename)
}

export function withLock<T>(filename: string, fn: () => T): T {
  acquireLock(filename)
  try {
    return fn()
  } finally {
    releaseLock(filename)
  }
}

export function readJson<T>(filename: string): T {
  const filePath = dataPath(filename)

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8')
      if (!raw.trim()) {
        throw new SyntaxError('JSON file is empty')
      }
      return parseJson<T>(filename, raw)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logJsonFile('read_parse_failure', filename, `attempt=${attempt} error="${message.slice(0, 180)}"`)
      if (attempt === 1) {
        sleepMs(30)
        continue
      }

      const cached = lastValidJson.get(filename)
      if (cached) {
        logJsonFile('read_restore_last_valid', filename)
        return parseJson<T>(filename, cached)
      }

      throw new Error(`Failed to read valid JSON from ${filename}: ${message}`)
    }
  }

  throw new Error(`Failed to read valid JSON from ${filename}`)
}

export function writeJson<T>(filename: string, data: T): void {
  const filePath = dataPath(filename)
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`
  const payload = `${JSON.stringify(data, null, 2)}\n`

  if (writeLocks.has(filename)) {
    logJsonFile('write_wait', filename)
  }

  while (writeLocks.has(filename)) {
    sleepMs(10)
  }

  writeLocks.add(filename)
  logJsonFile('write_lock_acquired', filename)
  try {
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
  } catch (error) {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
    } catch { /* ignore temp cleanup */ }
    const message = error instanceof Error ? error.message : String(error)
    logJsonFile('write_failed', filename, `error="${message.slice(0, 180)}"`)
    throw error
  } finally {
    writeLocks.delete(filename)
    logJsonFile('write_lock_released', filename)
  }
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'src', 'data')

export function readJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

export function writeJson<T>(filename: string, data: T): void {
  const filePath = path.join(DATA_DIR, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

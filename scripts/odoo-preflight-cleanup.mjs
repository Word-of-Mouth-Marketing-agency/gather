#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data')
const BACKUP_DIR = path.resolve(__dirname, '..', '.preflight-backups')

const FILES = [
  { file: 'products.json', idField: 'id', nameField: 'name' },
  { file: 'categories.json', idField: 'id', nameField: 'name' },
  { file: 'orders.json', idField: 'id', nameField: 'orderNumber' },
  { file: 'customers.json', idField: 'id', nameField: 'email' },
]

const ODOO_FIELDS = [
  'odooProductId',
  'odooCategoryId',
  'odooOrderId',
  'odooPartnerId',
  'syncStatus',
  'syncError',
  'lastSyncedAt',
]

const isWrite = process.argv.includes('--write')
let totalRemovedCount = 0
const results = []

for (const { file, idField, nameField } of FILES) {
  const filePath = path.join(DATA_DIR, file)
  let records

  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    records = JSON.parse(raw)
  } catch (err) {
    console.error(`[SKIP] ${file}: failed to read/parse — ${err.message}`)
    continue
  }

  if (isWrite) {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = path.join(BACKUP_DIR, `${file}.${timestamp}.bak`)
    fs.copyFileSync(filePath, backupPath)
    console.log(`[BACKUP] ${file} → ${backupPath}`)
  }

  let changed = 0
  const fileRemovals = []

  for (const record of records) {
    const removed = []
    for (const field of ODOO_FIELDS) {
      if (field in record) {
        removed.push(field)
        if (isWrite) {
          delete record[field]
        }
      }
    }
    if (removed.length > 0) {
      changed++
      const label = record[nameField] ?? record[idField] ?? '(unknown)'
      fileRemovals.push({ id: record[idField], label, fields: removed })
    }
  }

  if (isWrite) {
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2) + '\n', 'utf-8')
    console.log(`[WRITE] ${file}: ${changed} record(s) cleaned`)
  } else {
    console.log(`[DRY] ${file}: ${changed} record(s) would be cleaned`)
  }

  for (const r of fileRemovals) {
    console.log(`  ${r.id} (${r.label}): ${r.fields.join(', ')}`)
    totalRemovedCount += r.fields.length
  }

  results.push({ file, total: records.length, changed, removals: fileRemovals })
}

console.log('')
console.log('═'.repeat(50))
console.log(`Mode:          ${isWrite ? 'WRITE' : 'DRY RUN'} (use --write to apply)`)
console.log(`Files checked: ${FILES.length}`)
console.log(`Files changed: ${results.filter((r) => r.changed > 0).length}`)
console.log(`Records with sync fields: ${results.reduce((a, r) => a + r.changed, 0)}`)
console.log(`Field removals:           ${totalRemovedCount}`)
console.log('')
console.log('Fields removed:')
for (const f of ODOO_FIELDS) {
  const count = results.reduce((a, r) => a + r.removals.reduce((c, rm) => c + (rm.fields.includes(f) ? 1 : 0), 0), 0)
  if (count > 0) console.log(`  ${f}: ${count}`)
}
console.log('')
console.log('Bundles: NOT touched (bundles.json excluded)')

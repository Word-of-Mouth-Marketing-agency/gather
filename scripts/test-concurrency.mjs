// Concurrency stress tests for order locking
// Run: npx tsx scripts/test-concurrency.mjs
import { readFileSync, writeFileSync, existsSync } from 'fs'

const ORDERS_FILE = 'src/data/orders.json'
const backup = existsSync(ORDERS_FILE) ? readFileSync(ORDERS_FILE, 'utf-8') : '[]'
writeFileSync(ORDERS_FILE, '[]\n')

let failures = 0
function assert(label, ok, detail) {
  if (ok) console.log(`  PASS: ${label}`)
  else { console.log(`  FAIL: ${label} — ${detail || ''}`); failures++ }
}

// Test 1: 20 concurrent createOrder
console.log('\n=== Test 1: 20 concurrent createOrder ===')
const { createOrder, getAllOrders } = await import('../src/lib/orders.ts')
const results = await Promise.allSettled(
  Array.from({ length: 20 }, (_, i) =>
    createOrder({
      items: [{ type: 'product', productId: `p${i}`, name: `T${i}`, price: 100, quantity: 1 }],
      subtotal: 100, shippingFee: 55, total: 155, currency: 'EGP',
      customer: { firstName: `T${i}`, lastName: 'U', email: `t${i}@x.com`, phone: '0' },
      delivery: { city: 'C', address: 'A', date: '2026-07-20', slot: '12-14' },
      paymentMethod: 'cod', notes: '', acceptedPrivacyPolicy: true,
      acceptedRefundPolicy: true, acceptedPoliciesAt: new Date().toISOString(),
    })
  )
)
const ok = results.filter(r => r.status === 'fulfilled').length
assert('all 20 created', ok === 20, `${ok}/20`)
const orders = getAllOrders()
const ids = new Set(orders.map(o => o.id))
assert('all IDs unique', ids.size === 20, `${ids.size} unique`)
const raw = JSON.parse(readFileSync(ORDERS_FILE, 'utf-8'))
assert('no file duplicates', raw.length === 20, `${raw.length}`)
writeFileSync(ORDERS_FILE, '[]\n')

// Test 2: Concurrent create + status + email reservation
console.log('\n=== Test 2: Concurrent ops on same order ===')
const order = createOrder({
  items: [{ type: 'product', productId: 'px', name: 'X', price: 100, quantity: 1 }],
  subtotal: 100, shippingFee: 55, total: 155, currency: 'EGP',
  customer: { firstName: 'CX', lastName: 'T', email: 'cx@x.com', phone: '0' },
  delivery: { city: 'C', address: 'A', date: '2026-07-20', slot: '12-14' },
  paymentMethod: 'cod', notes: '', acceptedPrivacyPolicy: true,
  acceptedRefundPolicy: true, acceptedPoliciesAt: new Date().toISOString(),
})
const { updateOrderStatus, reserveAdminEmail } = await import('../src/lib/orders.ts')
const r = await Promise.allSettled([
  updateOrderStatus(order.id, 'confirmed'),
  updateOrderStatus(order.id, 'preparing'),
  reserveAdminEmail(order.id),
])
assert('3 concurrent ops completed', r.filter(x => x.status === 'fulfilled').length === 3, '')
try { JSON.parse(readFileSync(ORDERS_FILE, 'utf-8')); assert('JSON valid after ops', true) }
catch { assert('JSON valid after ops', false, 'corrupt') }
writeFileSync(ORDERS_FILE, '[]\n')

// Test 3: Async lock sequential
console.log('\n=== Test 3: Sequential lock/release ===')
const { withLock } = await import('../src/lib/db.ts')
let state3 = 0
await withLock('seq-test', () => { state3 = 1 })
assert('lock acquired and released', state3 === 1, '')

// Test 4: Lock released after error
console.log('\n=== Test 4: Lock release on error ===')
const { acquireLock: acq, releaseLock: rel } = await import('../src/lib/db.ts')
try { await withLock('err-test', () => { throw new Error('oops') }) } catch {}
await acq('err-test')
rel('err-test')
assert('lock released after error', true)

// Restore backup
writeFileSync(ORDERS_FILE, backup)
console.log(`\n=== ${failures} failures ===`)
process.exit(failures > 0 ? 1 : 0)

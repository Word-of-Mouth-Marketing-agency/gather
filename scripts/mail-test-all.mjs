// Comprehensive email flow test
// Run: node --env-file=.env.local scripts/mail-test-all.mjs

import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'

const {
  SMTP_HOST = 'mail.gather-eg.com',
  SMTP_PORT = '587',
  SMTP_SECURE = 'false',
  SMTP_USER = 'info@gather-eg.com',
  SMTP_PASSWORD = '',
  MAIL_FROM = 'Gather <info@gather-eg.com>',
  MAIL_TO = 'info@gather-eg.com',
  SITE_URL = 'https://gather-eg.com',
  SMTP_TLS_INSECURE = 'false',
} = process.env

let failures = 0

function assert(label, ok, detail) {
  if (ok) {
    console.log(`  PASS: ${label}`)
  } else {
    console.log(`  FAIL: ${label} — ${detail || 'unexpected'}`)
    failures++
  }
}

// 1. SMTP VERIFY
console.log('\n=== 1. SMTP Verify ===')
const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: SMTP_SECURE === 'true',
  auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: { rejectUnauthorized: SMTP_TLS_INSECURE !== 'true' },
})

try {
  await transport.verify()
  assert('transport.verify()', true)
} catch (err) {
  assert('transport.verify()', false, err.message)
}

// 2. SEND TEST TO SELF
console.log('\n=== 2. Send to MAIL_TO ===')
try {
  const info = await transport.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject: `[Gather Test] Local dev ${randomBytes(4).toString('hex')}`,
    text: 'Test from local dev environment.',
  })
  assert('send to MAIL_TO', info.accepted?.length > 0, `messageId=${info.messageId}`)
} catch (err) {
  assert('send to MAIL_TO', false, err.message)
}

// 3. SEND TO GMAIL TEST
console.log('\n=== 3. Send to Gmail test ===')
try {
  const info = await transport.sendMail({
    from: MAIL_FROM,
    to: 'gamergg92000@gmail.com',
    subject: `[Gather Test] Local dev ${randomBytes(4).toString('hex')}`,
    text: 'Test from local dev environment.',
  })
  assert('send to Gmail', info.accepted?.length > 0, `messageId=${info.messageId}`)
} catch (err) {
  assert('send to Gmail', false, err.message)
}

// 4. MOCK CONTACT FORM FLOW
console.log('\n=== 4. Simulated Contact Form ===')
try {
  const info = await transport.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject: `[Gather Contact] Test User`,
    text: [
      `Form: Contact Form`,
      `Customer: Test User`,
      `Email: testuser@example.com`,
      `Timestamp: ${new Date().toISOString()}`,
      `Source: /contact`,
      ``,
      `Message:`,
      `Test contact form submission.`,
    ].join('\n'),
    replyTo: 'testuser@example.com',
  })
  assert('contact form admin notification', info.accepted?.length > 0)
} catch (err) {
  assert('contact form admin notification', false, err.message)
}

// 5. MOCK ORDER FLOW
console.log('\n=== 5. Simulated Order Notification ===')
try {
  const adminInfo = await transport.sendMail({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject: `[Gather Order] GATHER-TEST-001`,
    text: [
      `New Order: GATHER-TEST-001`,
      `Customer: Test User`,
      `Email: testcustomer@example.com`,
      `Phone: +20123456789`,
      `City: Cairo`,
      `Address: Test Street 123`,
      `Payment: COD`,
      ``,
      `Items:`,
      `  Test Product x1 = 100.00 EGP`,
      ``,
      `Subtotal: 100.00 EGP`,
      `Delivery Fee: 55.00 EGP`,
      `Total: 155.00 EGP`,
      `Admin: ${SITE_URL}/admin/orders`,
    ].join('\n'),
  })
  assert('order admin notification', adminInfo.accepted?.length > 0)

  const customerInfo = await transport.sendMail({
    from: MAIL_FROM,
    to: 'testcustomer@example.com',
    subject: 'Order Confirmed — GATHER-TEST-001',
    text: [
      `Thank you for your order, Test!`,
      ``,
      `Order: GATHER-TEST-001`,
      ``,
      `Items:`,
      `  Test Product x1 = 100.00 EGP`,
      ``,
      `Total: 155.00 EGP`,
      ``,
      `If you have any questions, contact us at info@gather-eg.com`,
    ].join('\n'),
  })
  assert('order customer confirmation', customerInfo.accepted?.length > 0)
} catch (err) {
  assert('order notification', false, err.message)
}

// 6. MOCK FORGOT-PASSWORD FLOW
console.log('\n=== 6. Simulated Forgot Password ===')
try {
  const resetLink = `${SITE_URL}/reset-password?token=test-token-here&email=testcustomer%40example.com`
  const info = await transport.sendMail({
    from: MAIL_FROM,
    to: 'testcustomer@example.com',
    subject: 'Reset your Gather password',
    text: `You requested a password reset.\n\nClick this link to reset your password:\n${resetLink}\n\nIf you did not request this, please ignore this email.\n\nGather`,
  })
  assert('forgot-password email', info.accepted?.length > 0)
} catch (err) {
  assert('forgot-password email', false, err.message)
}

transport.close()

console.log(`\n=== Results: ${failures} failures ===`)
process.exit(failures > 0 ? 1 : 0)

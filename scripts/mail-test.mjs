// Nodemailer SMTP test — run with: node --env-file=.env.local scripts/mail-test.mjs
// Does NOT print secrets to console.

import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST || 'mail.gather-eg.com'
const port = Number(process.env.SMTP_PORT) || 587
const secure = process.env.SMTP_SECURE === 'true'
const user = process.env.SMTP_USER || 'info@gather-eg.com'
const pass = process.env.SMTP_PASSWORD || ''
const tlsInsecure = process.env.SMTP_TLS_INSECURE === 'true'

if (!pass) {
  console.log('FAIL: SMTP_PASSWORD is empty')
  process.exit(1)
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  tls: { rejectUnauthorized: !tlsInsecure },
})

console.log('Testing SMTP connection...')
console.log(`  host=${host} port=${port} secure=${secure}`)
console.log(`  rejectUnauthorized=${!tlsInsecure}`)

try {
  await transport.verify()
  console.log('  PASS: transport.verify()')
} catch (err) {
  console.log(`  FAIL: verify() — ${err.message}`)
  process.exit(1)
}

console.log('\nSending test to info@gather-eg.com...')
try {
  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || 'Gather <info@gather-eg.com>',
    to: 'info@gather-eg.com',
    subject: '[Gather Test] Local SMTP test',
    text: 'SMTP is working from local dev.\n\nIf you receive this, email sending works correctly.\n\nRegards,\nGather',
  })
  console.log(`  PASS: messageId=${info.messageId}`)
  console.log(`  Accepted: ${info.accepted?.length > 0 ? 'YES' : 'NO'}`)
  console.log(`  Rejected: ${info.rejected?.length > 0 ? info.rejected.join(',') : 'none'}`)
} catch (err) {
  console.log(`  FAIL: send — ${err.message}`)
  process.exit(1)
}

console.log('\nSending test to Gmail...')
try {
  const info = await transport.sendMail({
    from: process.env.MAIL_FROM || 'Gather <info@gather-eg.com>',
    to: 'gamergg92000@gmail.com',
    subject: '[Gather Test] Local dev SMTP to Gmail',
    text: 'This is a test from local development.\n\nRegards,\nGather',
  })
  console.log(`  PASS: messageId=${info.messageId}`)
  console.log(`  Accepted: ${info.accepted?.length > 0 ? 'YES' : 'NO'}`)
} catch (err) {
  console.log(`  FAIL: send — ${err.message}`)
  process.exit(1)
}

transport.close()
console.log('\nAll SMTP tests passed.')

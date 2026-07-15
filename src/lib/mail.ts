import nodemailer from 'nodemailer'
import fs from 'fs'

export interface MailOptions {
  to: string
  subject: string
  text?: string
  html?: string
  replyTo?: string
}

const smtpConfig = {
  host: process.env.SMTP_HOST || 'mail.gather-eg.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER || 'info@gather-eg.com',
  pass: process.env.SMTP_PASSWORD || '',
  from: process.env.MAIL_FROM || 'Gather <info@gather-eg.com>',
  adminTo: process.env.MAIL_TO || 'info@gather-eg.com',
  tlsCert: process.env.MAIL_TLS_CERT || '',
}

function createTransport() {
  if (!smtpConfig.pass) {
    return null
  }

  const tlsOptions: Record<string, unknown> = { rejectUnauthorized: true }
  if (smtpConfig.tlsCert) {
    try {
      tlsOptions.ca = fs.readFileSync(smtpConfig.tlsCert)
    } catch {
      console.warn('[Mail] MAIL_TLS_CERT path not readable:', smtpConfig.tlsCert)
    }
  }

  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: tlsOptions,
  })
}

function sanitizeForLog(value: string): string {
  return value.replace(/\n|\r/g, ' ').substring(0, 200)
}

export async function sendMail(options: MailOptions): Promise<boolean> {
  const transport = createTransport()
  if (!transport) {
    console.warn('[Mail] SMTP not configured — no password set. Skipping.')
    return false
  }

  try {
    const info = await transport.sendMail({
      from: smtpConfig.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo,
    })
    console.info('[Mail] sent', {
      to: sanitizeForLog(options.to),
      subject: sanitizeForLog(options.subject),
      messageId: info.messageId,
    })
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Mail] failed', {
      to: sanitizeForLog(options.to),
      subject: sanitizeForLog(options.subject),
      error: sanitizeForLog(message),
    })
    return false
  }
}

export async function sendAdminNotification(options: Omit<MailOptions, 'to'>): Promise<boolean> {
  return sendMail({ ...options, to: smtpConfig.adminTo })
}

export { smtpConfig }

'use client'

import { useSyncExternalStore } from 'react'

const SESSION_KEY = 'gather_customer_session'

export interface CustomerSession {
  id: string
  email: string
  name: string
}

let cachedRaw: string | null | undefined = undefined
let cachedSession: CustomerSession | null = null

function readSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw === cachedRaw) return cachedSession
    cachedRaw = raw
    if (!raw) {
      cachedSession = null
      return null
    }
    cachedSession = JSON.parse(raw) as CustomerSession
    return cachedSession
  } catch {
    cachedRaw = null
    cachedSession = null
    try { localStorage.removeItem(SESSION_KEY) } catch { /* ignore */ }
    return null
  }
}

function subscribeToSession(callback: () => void): () => void {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function getCustomerSession(): CustomerSession | null {
  return readSession()
}

export function setCustomerSession(session: CustomerSession): void {
  const raw = JSON.stringify(session)
  localStorage.setItem(SESSION_KEY, raw)
  cachedRaw = raw
  cachedSession = session
  window.dispatchEvent(new Event('storage'))
}

export function clearCustomerSession(): void {
  localStorage.removeItem(SESSION_KEY)
  cachedRaw = null
  cachedSession = null
  window.dispatchEvent(new Event('storage'))
}

export function useCustomerSession(): CustomerSession | null {
  return useSyncExternalStore(subscribeToSession, readSession, () => null)
}

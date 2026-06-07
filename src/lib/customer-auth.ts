'use client'

import { useSyncExternalStore } from 'react'

const SESSION_KEY = 'gather_customer_session'

export interface CustomerSession {
  id: string
  email: string
  name: string
}

function readSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CustomerSession
  } catch {
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
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event('storage'))
}

export function clearCustomerSession(): void {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('storage'))
}

export function useCustomerSession(): CustomerSession | null {
  return useSyncExternalStore(subscribeToSession, readSession, () => null)
}

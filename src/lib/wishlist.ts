'use client'

const WISHLIST_KEY = 'gather_wishlist'

export function getWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WISHLIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveWishlist(ids: string[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId)
}

export function toggleWishlist(productId: string): boolean {
  const list = getWishlist()
  const idx = list.indexOf(productId)
  if (idx >= 0) {
    list.splice(idx, 1)
    saveWishlist(list)
    return false
  } else {
    list.push(productId)
    saveWishlist(list)
    return true
  }
}

export function addToWishlist(productId: string): void {
  const list = getWishlist()
  if (!list.includes(productId)) {
    list.push(productId)
    saveWishlist(list)
  }
}

export function removeFromWishlist(productId: string): void {
  const list = getWishlist()
  const idx = list.indexOf(productId)
  if (idx >= 0) {
    list.splice(idx, 1)
    saveWishlist(list)
  }
}

export function getWishlistCount(): number {
  return getWishlist().length
}

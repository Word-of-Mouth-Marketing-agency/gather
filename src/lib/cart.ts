'use client'

import type { CartItem, Product } from '@/types'
import { getProductById, getDisplayPrice } from './data'

const CART_KEY = 'gather_cart'

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(productId: string, quantity = 1): CartItem[] {
  const cart = getCart()
  const existing = cart.find((item) => item.productId === productId)
  if (existing) {
    existing.quantity += quantity
  } else {
    cart.push({ productId, quantity })
  }
  saveCart(cart)
  return cart
}

export function removeFromCart(productId: string): CartItem[] {
  const cart = getCart().filter((item) => item.productId !== productId)
  saveCart(cart)
  return cart
}

export function updateQuantity(productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(productId)
  const cart = getCart()
  const item = cart.find((i) => i.productId === productId)
  if (item) item.quantity = quantity
  saveCart(cart)
  return cart
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    const product = getProductById(item.productId)
    if (!product) return sum
    return sum + getDisplayPrice(product) * item.quantity
  }, 0)
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartProducts(items: CartItem[]): Array<{ product: Product; quantity: number }> {
  return items
    .map((item) => {
      const product = getProductById(item.productId)
      return product ? { product, quantity: item.quantity } : null
    })
    .filter((x): x is { product: Product; quantity: number } => x !== null)
}

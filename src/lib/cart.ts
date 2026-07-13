'use client'

import type { CartItem, ProductCartItem, BundleCartItem, Bundle } from '@/types'
import { getBundleById, getProductById } from './data'
import { getActiveProductPrice, getProductCompareAtPrice, isBundlePurchasable } from './scheduled-discounts'

const CART_KEY = 'gather_cart'

function migrateItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== 'object') return null
  const i = raw as Record<string, unknown>

  if (i.type === 'bundle') {
    if (!i.id || !i.bundleId || !i.name || typeof i.quantity !== 'number' || i.quantity < 1) return null
    return raw as BundleCartItem
  }

  if (i.type === 'product') {
    if (!i.id || !i.productId || !i.name || typeof i.quantity !== 'number' || i.quantity < 1) return null
    const item = raw as ProductCartItem
    const product = getProductById(item.productId)
    if (!product) return null
    return {
      ...item,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: getActiveProductPrice(product),
      compareAtPrice: getProductCompareAtPrice(product),
      currency: product.currency,
    }
  }

  const old = raw as { productId?: string; quantity?: number }
  if (!old.productId || typeof old.quantity !== 'number' || old.quantity < 1) return null
  const product = getProductById(old.productId)
  if (!product) return null
  return {
    type: 'product',
    id: old.productId,
    productId: old.productId,
    name: product.name,
    slug: product.slug,
    image: product.images[0],
    price: getActiveProductPrice(product),
    compareAtPrice: getProductCompareAtPrice(product),
    currency: product.currency,
    quantity: old.quantity,
  }
}

function sanitize(raw: unknown[]): CartItem[] {
  return raw.map(migrateItem).filter((x): x is CartItem => x !== null)
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return sanitize(parsed)
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(productId: string, quantity = 1): CartItem[] {
  const cart = getCart()
  const existing = cart.find((item) => item.type === 'product' && item.productId === productId) as ProductCartItem | undefined
  if (existing) {
    existing.quantity += quantity
  } else {
    const product = getProductById(productId)
    if (!product) return cart
    const item: ProductCartItem = {
      type: 'product',
      id: productId,
      productId,
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: getActiveProductPrice(product),
      compareAtPrice: getProductCompareAtPrice(product),
      currency: product.currency,
      quantity,
    }
    cart.push(item)
  }
  saveCart(cart)
  return cart
}

export function addBundleToCart(bundle: Bundle): CartItem[] {
  const cart = getCart()
  if (!isBundlePurchasable(bundle)) return cart
  const existing = cart.find((item) => item.type === 'bundle' && item.bundleId === bundle.id) as BundleCartItem | undefined
  if (existing) {
    existing.quantity += 1
  } else {
    const productsSnapshot: BundleCartItem['productsSnapshot'] = [...new Set(bundle.productIds)]
      .map((pid) => {
        const p = getProductById(pid)
        if (!p) return null
        return { id: p.id, name: p.name, slug: p.slug, image: p.images[0], price: getActiveProductPrice(p) }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    const item: BundleCartItem = {
      type: 'bundle',
      id: bundle.id,
      bundleId: bundle.id,
      name: bundle.name,
      slug: bundle.slug,
      badge: bundle.badge,
      image: productsSnapshot[0]?.image,
      price: bundle.offerPrice,
      regularPrice: bundle.regularPrice,
      currency: bundle.currency || 'EGP',
      quantity: 1,
      productIds: [...new Set(bundle.productIds)],
      productsSnapshot,
    }
    cart.push(item)
  }
  saveCart(cart)
  return cart
}

export function getUnavailableCartBundles(items: CartItem[]): BundleCartItem[] {
  return items.filter((item): item is BundleCartItem => {
    if (item.type !== 'bundle') return false
    const bundle = getBundleById(item.bundleId)
    return !bundle || !isBundlePurchasable(bundle)
  })
}

export function removeFromCart(id: string): CartItem[] {
  const cart = getCart().filter((item) => item.id !== id)
  saveCart(cart)
  return cart
}

export function updateQuantity(id: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeFromCart(id)
  const cart = getCart()
  const item = cart.find((i) => i.id === id)
  if (item) item.quantity = quantity
  saveCart(cart)
  return cart
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function getCartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function getCartProducts(items: CartItem[]): Array<{ product: import('@/types').Product; quantity: number; cartItem: ProductCartItem }> {
  return items
    .filter((item): item is ProductCartItem => item.type === 'product')
    .map((item) => {
      const product = getProductById(item.productId)
      return product ? { product, quantity: item.quantity, cartItem: item } : null
    })
    .filter((x): x is { product: import('@/types').Product; quantity: number; cartItem: ProductCartItem } => x !== null)
}

export function getCartBundles(items: CartItem[]): BundleCartItem[] {
  return items.filter((item): item is BundleCartItem => item.type === 'bundle')
}

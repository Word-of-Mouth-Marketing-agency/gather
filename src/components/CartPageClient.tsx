'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { CartItem, Product } from '@/types'
import { getCart, getCartTotal, getCartProducts, updateQuantity, removeFromCart } from '@/lib/cart'
import { formatPrice, getDisplayPrice } from '@/lib/data'

type CartEntry = { product: Product; quantity: number }

export default function CartPageClient() {
  const [entries, setEntries] = useState<CartEntry[]>([])
  const [items, setItems] = useState<CartItem[]>([])

  const refresh = () => {
    const cart = getCart()
    setItems(cart)
    setEntries(getCartProducts(cart))
  }

  useEffect(() => {
    refresh()
    window.addEventListener('gather:cart-updated', refresh)
    return () => window.removeEventListener('gather:cart-updated', refresh)
  }, [])

  const total = getCartTotal(items)

  if (entries.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-6xl mb-4">🛍️</div>
        <h1 className="text-2xl font-black text-[#171717]">Your cart is empty</h1>
        <p className="mt-2 text-gray-400 text-sm">Start shopping to fill it up.</p>
        <Link href="/shop-by-category" className="inline-flex mt-6 gather-btn-primary">
          Browse Products
        </Link>
      </main>
    )
  }

  function handleQty(productId: string, qty: number) {
    updateQuantity(productId, qty)
    window.dispatchEvent(new Event('gather:cart-updated'))
    refresh()
  }

  function handleRemove(productId: string) {
    removeFromCart(productId)
    window.dispatchEvent(new Event('gather:cart-updated'))
    refresh()
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-black text-[#171717] mb-8">
        Your Cart ({entries.length} {entries.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {entries.map(({ product, quantity }) => (
            <div key={product.id} className="flex gap-4 p-4 rounded-2xl bg-white border border-[#f1e2d3] hover:shadow-md transition-shadow">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#f8f8f8] shrink-0">
                {product.images[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🎁</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#171717] line-clamp-2">{product.name}</h3>
                <p className="mt-1 text-[#ff7a1a] font-black text-sm">
                  {formatPrice(getDisplayPrice(product), product.currency)}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  {/* Qty */}
                  <div className="flex items-center border border-gray-200 rounded-full overflow-hidden text-sm">
                    <button
                      onClick={() => handleQty(product.id, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-600"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => handleQty(product.id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-600"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(product.id)}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-black text-sm text-[#171717]">
                  {formatPrice(getDisplayPrice(product) * quantity, product.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="gather-section p-6 rounded-3xl sticky top-24">
            <h2 className="text-lg font-black text-[#171717] mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              {entries.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between gap-2 text-gray-500">
                  <span className="truncate">{product.name} × {quantity}</span>
                  <span className="shrink-0 font-medium text-gray-700">
                    {formatPrice(getDisplayPrice(product) * quantity, product.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[rgba(255,122,26,0.15)] flex justify-between items-center">
              <span className="font-bold text-sm text-[#7a6247]">Subtotal</span>
              <span className="font-black text-xl text-[#ff7a1a]">{formatPrice(total, 'EGP')}</span>
            </div>

            <p className="mt-2 text-xs text-gray-400">Delivery fee calculated at checkout.</p>

            <Link href="/checkout" className="block w-full text-center mt-5 gather-btn-primary py-3.5 text-base shadow-lg">
              Proceed to Checkout
            </Link>

            <Link href="/shop-by-category" className="block w-full text-center mt-3 text-sm text-[#7a6247] hover:text-[#ff7a1a] font-medium transition-colors">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

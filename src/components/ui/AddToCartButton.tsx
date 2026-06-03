'use client'

import { useState } from 'react'
import type { Product } from '@/types'
import { addToCart } from '@/lib/cart'

interface Props {
  product: Product
}

export default function AddToCartButton({ product }: Props) {
  const [qty, setQty] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  async function handleAdd() {
    if (product.stock === 0) return
    setAdding(true)
    addToCart(product.id, qty)
    window.dispatchEvent(new Event('gather:cart-updated'))
    await new Promise((r) => setTimeout(r, 500))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Qty selector */}
      <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="w-10 h-12 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="w-10 text-center font-bold text-sm">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="w-10 h-12 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      {/* Add to cart */}
      <button
        onClick={handleAdd}
        disabled={adding || product.stock === 0}
        className={`flex-1 h-12 rounded-full font-black text-sm transition-all duration-200 ${
          added
            ? 'bg-green-500 text-white'
            : product.stock === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#ff7a1a] text-white hover:bg-[#fe6c00] hover:-translate-y-0.5 shadow-lg hover:shadow-xl'
        }`}
      >
        {added ? '✓ Added to Cart' : adding ? 'Adding...' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  )
}

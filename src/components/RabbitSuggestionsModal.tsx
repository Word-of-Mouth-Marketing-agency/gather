'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import type { Product } from '@/types'
import { formatPrice } from '@/lib/data'

interface Props {
  open: boolean
  suggestions: Product[]
  onAddExtras: (selected: Product[]) => void
  onContinue: () => void
}

export default function RabbitSuggestionsModal({ open, suggestions, onAddExtras, onContinue }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const handleContinue = useCallback(() => {
    setSelected(new Set())
    onContinue()
  }, [onContinue])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleContinue()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, handleContinue])

  if (!open) return null

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedProducts = suggestions.filter((p) => selected.has(p.id))
  const extrasTotal = selectedProducts.reduce((sum, p) => sum + (p.salePrice ?? p.price), 0)

  const handleAdd = () => {
    onAddExtras(selectedProducts)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={handleContinue}
    >
      <div
        className="relative w-full max-w-lg bg-[#fff4e8] rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 shrink-0 rounded-full bg-white border-2 border-[#FE7501] flex items-center justify-center overflow-hidden shadow-md">
            <Image
              src="/assets/gather/rabbit/floating-rabbit.webp"
              alt="Rabbit"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">
              Before you go...
            </h2>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#7a6247] mb-6">
          Rabbit found a few extras that can add more joy to your gathering.
        </p>

        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-[#7a6247]">
            <p className="font-semibold mb-4">No suggestions available right now.</p>
            <button onClick={handleContinue} className="gather-btn-primary px-8 py-3 text-base shadow-lg">
              Continue
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {suggestions.map((product) => {
                const checked = selected.has(product.id)
                return (
                  <label
                    key={product.id}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                      checked ? 'bg-white shadow-md ring-2 ring-[#FE7501]' : 'bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="w-14 h-14 shrink-0 rounded-lg bg-[#f5efe9] overflow-hidden flex items-center justify-center">
                      {product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={56}
                          height={56}
                          className="object-cover w-full h-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#171717] truncate">{product.name}</p>
                      <p className="text-xs font-bold text-[#FE7501]">{formatPrice(product.salePrice ?? product.price, product.currency)}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(product.id)}
                      className="h-5 w-5 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40"
                    />
                  </label>
                )
              })}
            </div>

            {extrasTotal > 0 && (
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-sm font-semibold text-[#171717]">Selected extras total</span>
                <span className="text-base font-black text-[#FE7501]">{formatPrice(extrasTotal)}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAdd}
                disabled={selectedProducts.length === 0}
                className="gather-btn-primary flex-1 justify-center py-3.5 text-base shadow-lg disabled:opacity-50"
              >
                Add selected extras
              </button>
              <button
                onClick={handleContinue}
                className="gather-btn-secondary flex-1 justify-center py-3.5 text-base"
              >
                No thanks, continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

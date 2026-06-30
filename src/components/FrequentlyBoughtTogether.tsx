'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/types'
import { formatPrice, getDisplayPrice } from '@/lib/data'
import { addToCart } from '@/lib/cart'
import { useLocale } from '@/components/LocaleProvider'

interface Props {
  products: Product[]
}

export default function FrequentlyBoughtTogether({ products }: Props) {
  const { t } = useLocale()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(products.map((p) => p.id))
  )
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const selectedProducts = products.filter((p) => selected.has(p.id))
  const total = selectedProducts.reduce((sum, p) => sum + getDisplayPrice(p), 0)

  async function handleAddSelected() {
    if (selected.size === 0) return
    setAdding(true)
    for (const id of selected) addToCart(id)
    window.dispatchEvent(new Event('gather:cart-updated'))
    await new Promise((r) => setTimeout(r, 500))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <section className="gather-section p-6 rounded-3xl">
      <div className="mb-5">
        <h2 className="text-xl font-black text-[#171717]">{t('fbt.title')}</h2>
        <p className="mt-1 text-sm text-[#7a6247]">{t('fbt.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {products.map((product) => {
          const isChecked = selected.has(product.id)
          return (
            <article
              key={product.id}
              className={`flex items-center gap-4 p-3 rounded-[18px] bg-white border transition-all duration-200 ${
                isChecked ? 'border-[#f1e2d3] shadow-sm' : 'border-gray-100'
              } hover:-translate-y-0.5 hover:shadow-md`}
            >
              <label className="grid grid-cols-[32px_72px_1fr] gap-3 items-center flex-1 cursor-pointer min-w-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isChecked}
                  onChange={() => toggle(product.id)}
                />
                {/* Check indicator */}
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black transition-colors ${
                    isChecked
                      ? 'bg-[#ff7a1a] text-white shadow-[0_6px_14px_rgba(255,122,26,0.25)]'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {isChecked ? '✓' : ''}
                </span>

                {/* Image */}
                <div className="w-[72px] h-[72px] rounded-[14px] bg-[#f8f8f8] overflow-hidden flex items-center justify-center shrink-0">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={72}
                      height={72}
                      className="object-contain p-2"
                    />
                  ) : (
                    <span className="text-2xl">🎁</span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#222] line-clamp-2 leading-snug">
                    {product.name}
                  </p>
                  <p className="mt-1 text-[#ff7a1a] font-black text-sm">
                    {formatPrice(getDisplayPrice(product), product.currency)}
                  </p>
                </div>
              </label>

              <Link
                href={`/products/${product.slug}`}
                className="shrink-0 inline-flex items-center justify-center h-9 px-3 rounded-full bg-[#fff4e8] text-[#ff7a1a] text-xs font-black hover:bg-[#ff7a1a] hover:text-white transition-colors"
              >
                {t('fbt.view')}
              </Link>
            </article>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between gap-4 p-4 bg-white rounded-[18px] border border-[#f1e2d3] shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
        <div>
          <p className="text-xs font-bold text-[#7a6247]">{t('fbt.selectedTotal')}</p>
          <p className="text-2xl font-black text-[#111]">{formatPrice(total, 'EGP')}</p>
        </div>
        <button
          onClick={handleAddSelected}
          disabled={selected.size === 0 || adding}
          className={`min-w-[180px] h-12 rounded-full font-black text-sm transition-all duration-200 ${
            added
              ? 'bg-green-500 text-white'
              : selected.size === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-[#ff7a1a] text-white hover:bg-[#fe6c00] hover:-translate-y-0.5'
          }`}
        >
          {added ? t('fbt.addedAll') : adding ? t('fbt.adding') : t('fbt.addSelected')}
        </button>
      </div>
    </section>
  )
}

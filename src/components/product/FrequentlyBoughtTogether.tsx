'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/types'
import { addToCart } from '@/lib/cart'
import { formatPrice, getDisplayPrice } from '@/lib/data'
import { useLocale } from '@/components/LocaleProvider'

interface Props {
  currentProduct: Product
  suggestions: Product[]
}

export default function FrequentlyBoughtTogether({ currentProduct, suggestions }: Props) {
  const { locale, href, t } = useLocale()
  const products = [currentProduct, ...suggestions].slice(0, 4)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const total = products.reduce((sum, product) => sum + getDisplayPrice(product), 0)

  async function handleAddAll() {
    setAdding(true)
    for (const product of products) {
      addToCart(product.id, 1)
    }
    window.dispatchEvent(new Event('gather:cart-updated'))
    await new Promise((resolve) => setTimeout(resolve, 500))
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  if (products.length <= 1) return null

  return (
    <section className="rounded-[28px] border border-[#ead8c4] bg-[#fffaf3] p-5 sm:p-7">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#171717]">{t('fbt.title')}</h2>
          <p className="mt-1 text-sm font-semibold text-[#7a6247]">
            {t('fbt.pairSubtitle')}
          </p>
        </div>
        <div className="lg:text-right">
          <p className="text-xs font-black uppercase text-[#7a6247]">{t('fbt.totalPrice')}</p>
          <p className="text-2xl font-black text-[#FE7501]">{formatPrice(total, currentProduct.currency)}</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
          {products.map((product, index) => (
            <div key={product.id} className="contents">
              {index > 0 && <span className="text-2xl font-black text-[#FE7501]">+</span>}
              <article className="w-[150px] sm:w-[170px] rounded-2xl border border-[#ead8c4] bg-white p-3">
                <Link href={href(`/products/${product.slug}`)} className="block">
                  <div className="relative h-28 rounded-xl bg-[#fffaf3]">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={locale === 'ar' ? product.nameAr ?? product.name : product.name}
                        fill
                        className="object-contain p-3"
                        sizes="170px"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#7a6247]">
                        {t('fbt.noImage')}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-snug text-[#171717]">
                    {locale === 'ar' ? product.nameAr ?? product.name : product.name}
                  </h3>
                  <p className="mt-1 text-sm font-black text-[#FE7501]">
                    {formatPrice(getDisplayPrice(product), product.currency)}
                  </p>
                </Link>
              </article>
            </div>
          ))}
        </div>

        <button
          onClick={handleAddAll}
          disabled={adding}
          className={`h-[52px] min-w-full sm:min-w-[220px] rounded-full px-7 text-sm font-black transition-all duration-200 xl:min-w-[230px] ${
            added
              ? 'bg-green-500 text-white'
              : 'bg-[#FE7501] text-white shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5'
          }`}
        >
          {added ? t('fbt.addedAllCart') : adding ? t('fbt.adding') : t('fbt.addAll')}
        </button>
      </div>
    </section>
  )
}

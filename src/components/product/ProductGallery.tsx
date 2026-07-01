'use client'

import { useState } from 'react'
import { useLocale } from '@/components/LocaleProvider'

interface Props {
  images: string[]
  productName: string
  hasDiscount?: boolean
}

export default function ProductGallery({ images, productName, hasDiscount = false }: Props) {
  const safeImages = images.length > 0 ? images : ['']
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = safeImages[activeIndex] ?? safeImages[0]
  const { t } = useLocale()

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {safeImages.length > 1 && (
        <div className="order-2 lg:order-1 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
          {safeImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              onClick={() => setActiveIndex(index)}
              className={`relative h-20 w-20 shrink-0 rounded-2xl border bg-[#fffaf3] transition-colors ${
                activeIndex === index
                  ? 'border-[#FE7501] ring-2 ring-[#FE7501]/20'
                  : 'border-[#ead8c4] hover:border-[#FE7501]'
              }`}
              aria-label={`View ${productName} image ${index + 1}`}
            >
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 object-contain p-2 w-full h-full"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#7a6247]">
                  {t('fbt.noImage')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="order-1 lg:order-2 relative min-h-[340px] sm:min-h-[460px] lg:min-h-[560px] flex-1 rounded-[28px] bg-[#fffaf3] border border-[#ead8c4] overflow-hidden">
        {activeImage ? (
          <img
            src={activeImage}
            alt={productName}
            className="absolute inset-0 object-contain p-8 sm:p-10 w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#7a6247]">
            {t('fbt.noImage')}
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-5 top-5 rounded-full bg-[#FE7501] px-4 py-2 text-xs font-black uppercase text-white shadow-lg">
            {t('product.sale')}
          </span>
        )}
      </div>
    </div>
  )
}

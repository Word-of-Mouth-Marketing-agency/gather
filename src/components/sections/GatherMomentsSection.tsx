'use client'

import { useState, useEffect } from 'react'
import type { MomentsSectionProps } from '@/types'
import MomentsCarousel from './MomentsCarousel'
import ShareMomentModal from '@/components/ShareMomentModal'

export default function GatherMomentsSection({
  title,
  subtitle,
  images,
  buttonText,
  backgroundImage,
}: MomentsSectionProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [sliderImages, setSliderImages] = useState<string[]>(images)

  useEffect(() => {
    fetch('/api/moments?showInSlider=true')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSliderImages(data.map((m: { imageUrl: string }) => m.imageUrl))
        }
      })
      .catch(() => {})
  }, [])

  const parts = title.split(/(Moments)/g)

  return (
    <section
      className="bg-cover bg-center bg-no-repeat py-14 sm:py-18 lg:py-22"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#171717] leading-tight">
            {parts.map((part, i) =>
              part.toLowerCase() === 'moments' ? (
                <span key={i} style={{ color: '#FE7501' }}>{part}</span>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
          </h2>
          {subtitle && (
            <p className="mt-2 text-base sm:text-lg text-[#7a6247] max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <MomentsCarousel images={sliderImages} gap={20} />

        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="gather-btn-primary text-base px-8 py-3"
          >
            {buttonText}
          </button>
        </div>
      </div>

      <ShareMomentModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  )
}

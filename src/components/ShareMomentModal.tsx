'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ShareMomentModal({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [occasion, setOccasion] = useState('')
  const [consent, setConsent] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onClose()
  }

  const reset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setOccasion('')
    setConsent(false)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Share your Gather moment"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={() => { onClose(); reset() }}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-2">
          Share Your Gather Moment
        </h2>
        <p className="text-sm sm:text-base text-[#7a6247] mb-6">
          Upload your celebration photo and get a chance to win a shopping voucher.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="moment-name" className="block text-sm font-semibold text-[#171717] mb-1">
              Name
            </label>
            <input
              id="moment-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE7501]/40 focus:border-[#FE7501]"
            />
          </div>

          <div>
            <label htmlFor="moment-photo" className="block text-sm font-semibold text-[#171717] mb-1">
              Upload your celebration photo
            </label>
            <input
              id="moment-photo"
              type="file"
              accept="image/*"
              onChange={() => {}}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#FE7501]/10 file:text-[#FE7501] hover:file:bg-[#FE7501]/20"
            />
          </div>

          <div>
            <label htmlFor="moment-email" className="block text-sm font-semibold text-[#171717] mb-1">
              Email Address
            </label>
            <input
              id="moment-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE7501]/40 focus:border-[#FE7501]"
            />
          </div>

          <div>
            <label htmlFor="moment-phone" className="block text-sm font-semibold text-[#171717] mb-1">
              Phone
            </label>
            <input
              id="moment-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE7501]/40 focus:border-[#FE7501]"
            />
          </div>

          <div>
            <label htmlFor="moment-occasion" className="block text-sm font-semibold text-[#171717] mb-1">
              Occasion Type
            </label>
            <select
              id="moment-occasion"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE7501]/40 focus:border-[#FE7501]"
            >
              <option value="">Select occasion</option>
              <option value="birthday">Birthday</option>
              <option value="engagement">Engagement</option>
            </select>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="moment-consent"
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40"
            />
            <label htmlFor="moment-consent" className="text-xs sm:text-sm text-[#7a6247] leading-relaxed">
              I confirm that I own this photo or have permission to share it, and I allow GATHER to use it on the website, social media, and marketing materials.
            </label>
          </div>

          <button
            type="submit"
            className="gather-btn-primary w-full justify-center"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

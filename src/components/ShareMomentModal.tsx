'use client'

import { useState, useRef, useEffect, startTransition } from 'react'
import { useCustomerSession } from '@/lib/customer-auth'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ShareMomentModal({ open, onClose }: Props) {
  const session = useCustomerSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [occasion, setOccasion] = useState('')
  const [consent, setConsent] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const prefilledOpenRef = useRef<string | null>(null)

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

  useEffect(() => {
    if (!open) return
    startTransition(() => { setSuccess(false) })
    startTransition(() => { setErrors({}) })
    prefilledOpenRef.current = null
  }, [open])

  const customerName = session?.name ?? ''
  const customerEmail = session?.email ?? ''

  useEffect(() => {
    if (!open || !session) return
    if (prefilledOpenRef.current === 'done') return
    prefilledOpenRef.current = 'done'
    if (customerName) startTransition(() => { setName((prev) => prev || customerName) })
    if (customerEmail) startTransition(() => { setEmail((prev) => prev || customerEmail) })
    fetch(`/api/auth/customer?id=${encodeURIComponent(session.id)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((profile) => {
        const p = profile?.phone
        if (p) startTransition(() => { setPhone((prev) => prev || p) })
      })
      .catch(() => {})
  }, [open, session, customerName, customerEmail])

  if (!open) return null

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!file) errs.image = 'Photo is required'
    if (!consent) errs.consent = 'You must agree to share your photo'
    if (!occasion) errs.occasion = 'Please select an occasion'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Invalid email format'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('occasionType', occasion)
      formData.append('consent', 'true')
      if (email) formData.append('email', email)
      if (phone) formData.append('phone', phone)
      if (file) formData.append('image', file)

      const res = await fetch('/api/moments', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        setErrors({ form: data.error || 'Submission failed' })
        return
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setPhone('')
      setOccasion('')
      setConsent(false)
      setFile(null)
      setErrors({})
      if (fileRef.current) fileRef.current.value = ''
    } catch {
      setErrors({ form: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setName('')
    setEmail('')
    setPhone('')
    setOccasion('')
    setConsent(false)
    setFile(null)
    setErrors({})
    setSuccess(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
      reset()
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FE7501]/40 focus:border-[#FE7501] ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`

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

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#171717] mb-2">Thank You!</h3>
            <p className="text-sm text-[#7a6247] mb-6">
              Your moment has been submitted. It will appear on the website after admin review.
            </p>
            <button
              onClick={() => { onClose(); reset() }}
              className="gather-btn-primary justify-center w-full"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-2">
              Share Your Gather Moment
            </h2>
            <p className="text-sm sm:text-base text-[#7a6247] mb-6">
              Upload your celebration photo and get a chance to win a shopping voucher.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="moment-name" className="block text-sm font-semibold text-[#171717] mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="moment-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass('name')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="moment-photo" className="block text-sm font-semibold text-[#171717] mb-1">
                  Upload your celebration photo <span className="text-red-500">*</span>
                </label>
                <input
                  ref={fileRef}
                  id="moment-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[#FE7501]/10 file:text-[#FE7501] hover:file:bg-[#FE7501]/20"
                />
                {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
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
                  className={inputClass('email')}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
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
                  className={inputClass('phone')}
                />
              </div>

              <div>
                <label htmlFor="moment-occasion" className="block text-sm font-semibold text-[#171717] mb-1">
                  Occasion Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="moment-occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className={inputClass('occasion')}
                >
                  <option value="">Select occasion</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Engagement">Engagement</option>
                  <option value="Family Gathering">Family Gathering</option>
                  <option value="Friends Gathering">Friends Gathering</option>
                  <option value="Professional Meetings">Professional Meetings</option>
                  <option value="Christmas">Christmas</option>
                  <option value="Ramadan">Ramadan</option>
                  <option value="Mother's Day">Mother&apos;s Day</option>
                  <option value="Easter">Easter</option>
                  <option value="Eid Al-Fitr">Eid Al-Fitr</option>
                  <option value="Eid Al-Adha">Eid Al-Adha</option>
                  <option value="Other">Other</option>
                </select>
                {errors.occasion && <p className="text-xs text-red-500 mt-1">{errors.occasion}</p>}
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="moment-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className={`mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40 ${errors.consent ? 'ring-2 ring-red-400' : ''}`}
                />
                <label htmlFor="moment-consent" className="text-xs sm:text-sm text-[#7a6247] leading-relaxed">
                  I confirm that I own this photo or have permission to share it, and I allow GATHER to use it on the website, social media, and marketing materials. <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.consent && <p className="text-xs text-red-500 mt-0">{errors.consent}</p>}

              {errors.form && (
                <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
                  {errors.form}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="gather-btn-primary w-full justify-center disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, startTransition } from 'react'
import { useCustomerSession } from '@/lib/customer-auth'
import { useLocale } from '@/components/LocaleProvider'

interface Props {
  open: boolean
  onClose: () => void
}

export default function ShareMomentModal({ open, onClose }: Props) {
  const session = useCustomerSession()
  const { locale, isRTL, t } = useLocale()

  const occasionOptions = locale === 'ar' ? [
    { value: 'Birthday', label: 'عيد ميلاد' },
    { value: 'Engagement', label: 'خطوبة' },
    { value: 'Family Gathering', label: 'تجمع عائلي' },
    { value: 'Friends Gathering', label: 'تجمع أصدقاء' },
    { value: 'Professional Meetings', label: 'اجتماعات مهنية' },
    { value: 'Christmas', label: 'الكريسماس' },
    { value: 'Ramadan', label: 'رمضان' },
    { value: "Mother's Day", label: 'عيد الأم' },
    { value: 'Easter', label: 'عيد الفصح' },
    { value: 'Eid Al-Fitr', label: 'عيد الفطر' },
    { value: 'Eid Al-Adha', label: 'عيد الأضحى' },
    { value: 'Other', label: 'أخرى' },
  ] : [
    { value: 'Birthday', label: 'Birthday' },
    { value: 'Engagement', label: 'Engagement' },
    { value: 'Family Gathering', label: 'Family Gathering' },
    { value: 'Friends Gathering', label: 'Friends Gathering' },
    { value: 'Professional Meetings', label: 'Professional Meetings' },
    { value: 'Christmas', label: 'Christmas' },
    { value: 'Ramadan', label: 'Ramadan' },
    { value: "Mother's Day", label: "Mother's Day" },
    { value: 'Easter', label: 'Easter' },
    { value: 'Eid Al-Fitr', label: 'Eid Al-Fitr' },
    { value: 'Eid Al-Adha', label: 'Eid Al-Adha' },
    { value: 'Other', label: 'Other' },
  ]
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
    if (!name.trim()) errs.name = t('moment.nameRequired')
    if (!file) errs.image = t('moment.photoRequired')
    if (!consent) errs.consent = t('moment.consentRequired')
    if (!occasion) errs.occasion = t('moment.occasionRequired')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = t('moment.invalidEmail')
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
        setErrors({ form: data.error || t('moment.submissionFailed') })
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
      setErrors({ form: t('moment.networkError') })
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
          aria-label={t('moment.title')}
    >
        <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={() => { onClose(); reset() }}
          className={`absolute top-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors ${
            isRTL ? 'left-4' : 'right-4'
          }`}
          aria-label={t('common.closeModal')}
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
            <h3 className="text-xl font-bold text-[#171717] mb-2">{t('moment.thankYou')}</h3>
            <p className="text-sm text-[#7a6247] mb-6">
              {t('moment.submittedMsg')}
            </p>
            <button
              onClick={() => { onClose(); reset() }}
              className="gather-btn-primary justify-center w-full"
            >
              {t('moment.done')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl sm:text-3xl font-black text-[#171717] mb-2">
              {t('moment.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#7a6247] mb-6">
              {t('moment.subtitle')}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="moment-name" className="block text-sm font-semibold text-[#171717] mb-1">
                  {t('moment.name')} <span className="text-red-500">*</span>
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
                  {t('moment.uploadPhoto')} <span className="text-red-500">*</span>
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
                  {t('moment.email')}
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
                  {t('moment.phone')}
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
                  {t('moment.occasionType')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="moment-occasion"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className={inputClass('occasion')}
                >
                  <option value="">{t('moment.selectOccasion')}</option>
                  {occasionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
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
                  {t('moment.consent')} <span className="text-red-500">*</span>
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
                {submitting ? t('moment.submitting') : t('moment.submit')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

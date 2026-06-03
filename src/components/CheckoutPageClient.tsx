'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { CheckoutFormData, CartItem } from '@/types'
import { getCart, getCartTotal, getCartProducts, clearCart } from '@/lib/cart'
import { formatPrice, getDisplayPrice } from '@/lib/data'

const DELIVERY_CITIES = ['Dokki', 'Mohandessin', 'Manial', 'Zamalek', 'Haram'] as const

const DELIVERY_SLOTS = [
  { value: '10:00-12:00', label: '10:00 AM – 12:00 PM' },
  { value: '12:00-14:00', label: '12:00 PM – 2:00 PM' },
  { value: '14:00-16:00', label: '2:00 PM – 4:00 PM' },
  { value: '16:00-18:00', label: '4:00 PM – 6:00 PM' },
  { value: '18:00-20:00', label: '6:00 PM – 8:00 PM' },
  { value: '20:00-22:00', label: '8:00 PM – 10:00 PM' },
  { value: 'outside-hours', label: 'Outside working hours (special request)' },
] as const

const LAST_ALLOWED_SAME_DAY_HOUR = 14

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function slotStartHour(slot: string): number | null {
  if (!slot || slot === 'outside-hours') return null
  return parseInt(slot.split('-')[0].split(':')[0], 10)
}

const empty: CheckoutFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  address: '',
  deliveryDate: '',
  deliverySlot: '',
  orderNotes: '',
  paymentMethod: 'cod',
}

export default function CheckoutPageClient() {
  const router = useRouter()
  const [form, setForm] = useState<CheckoutFormData>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [showSameDayPopup, setShowSameDayPopup] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    setItems(getCart())
  }, [])

  const entries = getCartProducts(items)
  const subtotal = getCartTotal(items)

  function set(field: keyof CheckoutFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))

    if (field === 'deliveryDate' || field === 'deliverySlot') {
      const date = field === 'deliveryDate' ? value : form.deliveryDate
      const slot = field === 'deliverySlot' ? value : form.deliverySlot
      if (date === todayString() && slot) {
        const hour = slotStartHour(slot)
        if (hour !== null && hour >= LAST_ALLOWED_SAME_DAY_HOUR) {
          setShowSameDayPopup(true)
        }
      }
    }
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (!form.city) e.city = 'Please select a delivery city'
    if (!form.address.trim()) e.address = 'Required'
    if (!form.deliveryDate) e.deliveryDate = 'Required'
    if (!form.deliverySlot) e.deliverySlot = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    // Simulate order placement
    await new Promise((r) => setTimeout(r, 1200))
    clearCart()
    window.dispatchEvent(new Event('gather:cart-updated'))
    router.push('/checkout/success')
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl sm:text-3xl font-black text-[#171717] mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Billing */}
            <section className="gather-section p-6 rounded-3xl space-y-4">
              <h2 className="text-lg font-black text-[#171717]">Billing Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" error={errors.firstName}>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    className={inputCls(!!errors.firstName)}
                    placeholder="Ahmed"
                  />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    className={inputCls(!!errors.lastName)}
                    placeholder="Hassan"
                  />
                </Field>
              </div>

              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputCls(!!errors.email)}
                  placeholder="ahmed@example.com"
                />
              </Field>

              <Field label="Phone number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className={inputCls(!!errors.phone)}
                  placeholder="+20 10 0000 0000"
                />
              </Field>

              <Field label="City / Area" error={errors.city}>
                <select
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className={inputCls(!!errors.city)}
                >
                  <option value="">Select your city / area</option>
                  {DELIVERY_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[#6b4b00] bg-[#fff7df] border border-[#f1d38a] border-l-4 border-l-[#d99a00] rounded-lg px-3 py-2">
                  More locations will be available soon.
                </p>
              </Field>

              <Field label="Street address" error={errors.address}>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={inputCls(!!errors.address)}
                  placeholder="123 El Nasr Street, Apt 4B"
                />
              </Field>
            </section>

            {/* Delivery */}
            <section className="rounded-[14px] p-5 bg-[#fffaf2] border border-[#f2d7a2] space-y-4">
              <h2 className="text-lg font-black text-[#171717]">Delivery Details</h2>
              <p className="text-sm text-[#6b4b00]">
                Choose your preferred delivery date and time slot so we can prepare your order.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Delivery Date" error={errors.deliveryDate}>
                  <input
                    type="date"
                    value={form.deliveryDate}
                    min={todayString()}
                    onChange={(e) => set('deliveryDate', e.target.value)}
                    className={inputCls(!!errors.deliveryDate)}
                  />
                </Field>

                <Field label="Preferred Delivery Time" error={errors.deliverySlot}>
                  <select
                    value={form.deliverySlot}
                    onChange={(e) => set('deliverySlot', e.target.value)}
                    className={inputCls(!!errors.deliverySlot)}
                  >
                    <option value="">Select preferred delivery time</option>
                    {DELIVERY_SLOTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            {/* Order notes */}
            <section className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Order Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={form.orderNotes}
                onChange={(e) => set('orderNotes', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors resize-none"
                placeholder="Any special instructions, card message, etc."
              />
            </section>

            {/* Payment */}
            <section className="gather-section p-6 rounded-3xl space-y-3">
              <h2 className="text-lg font-black text-[#171717]">Payment</h2>
              {[
                { value: 'cod', label: 'Cash on Delivery', icon: '💵' },
                { value: 'card', label: 'Credit / Debit Card (coming soon)', icon: '💳', disabled: true },
              ].map((method) => (
                <label
                  key={method.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    form.paymentMethod === method.value
                      ? 'border-[#ff7a1a] bg-[#fff4e8]'
                      : 'border-gray-200 hover:border-[#ff7a1a]/40'
                  } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={form.paymentMethod === method.value}
                    onChange={() => !method.disabled && set('paymentMethod', method.value)}
                    className="accent-[#ff7a1a]"
                    disabled={method.disabled}
                  />
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{method.label}</span>
                </label>
              ))}
            </section>
          </div>

          {/* Right: order summary */}
          <div className="lg:col-span-2">
            <div className="gather-section p-6 rounded-3xl sticky top-24 space-y-4">
              <h2 className="text-lg font-black text-[#171717]">Your Order</h2>

              <div className="space-y-3">
                {entries.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 text-sm">
                    <span className="flex-1 text-gray-700 font-medium line-clamp-2">{product.name}</span>
                    <span className="shrink-0 text-gray-500">×{quantity}</span>
                    <span className="shrink-0 font-bold text-[#171717]">
                      {formatPrice(getDisplayPrice(product) * quantity, product.currency)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[rgba(255,122,26,0.15)] flex justify-between items-center">
                <span className="text-sm font-bold text-[#7a6247]">Total</span>
                <span className="text-2xl font-black text-[#ff7a1a]">{formatPrice(subtotal, 'EGP')}</span>
              </div>

              <button
                type="submit"
                disabled={submitting || entries.length === 0}
                className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Same-day popup */}
      {showSameDayPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/62" onClick={() => setShowSameDayPopup(false)} />
          <div className="relative z-10 w-full max-w-[460px] rounded-3xl bg-[#fffaf2] border border-[#f2d7a2] shadow-[0_24px_70px_rgba(0,0,0,0.24)] p-7 text-center">
            <button
              onClick={() => setShowSameDayPopup(false)}
              className="absolute top-3 right-3.5 w-8 h-8 rounded-full bg-white text-gray-700 text-2xl leading-none hover:bg-gray-50 transition-colors"
            >
              ×
            </button>
            <div className="w-16 h-16 rounded-full bg-[#ff7a1a] text-white text-3xl flex items-center justify-center mx-auto mb-4">
              🕒
            </div>
            <h3 className="text-2xl font-black text-[#171717] mb-2">Same-day delivery notice</h3>
            <p className="text-[#6b4b00] font-semibold text-sm leading-relaxed">
              Same-day delivery is available until 2:00 PM only. Your order will be delivered tomorrow.
            </p>
            <div className="grid gap-3 mt-6">
              <button
                onClick={() => {
                  set('deliveryDate', tomorrowString())
                  setShowSameDayPopup(false)
                }}
                className="w-full h-12 rounded-full bg-[#ff7a1a] text-white font-black text-sm hover:bg-[#fe6c00] transition-colors"
              >
                Set delivery to tomorrow
              </button>
              <button
                onClick={() => setShowSameDayPopup(false)}
                className="w-full h-12 rounded-full border border-[#f1c9a4] bg-white text-[#7a4a18] font-black text-sm hover:bg-[#fff4e8] transition-colors"
              >
                Change time slot
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function inputCls(hasError: boolean) {
  return `w-full min-h-[50px] rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-[#ff7a1a] focus:ring-[#ff7a1a]/20'
  }`
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

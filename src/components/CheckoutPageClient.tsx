'use client'

import { useState, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { CheckoutFormData, BundleCartItem, ShippingFee } from '@/types'
import PageTitleSection from '@/components/PageTitleSection'
import { getCart, getCartTotal, getCartProducts, getCartBundles, clearCart } from '@/lib/cart'
import { formatPrice } from '@/lib/data'
import { useCustomerSession } from '@/lib/customer-auth'

const DELIVERY_SLOTS = [
  { value: '10:00-12:00', label: '10:00 AM – 12:00 PM' },
  { value: '12:00-14:00', label: '12:00 PM – 2:00 PM' },
  { value: '14:00-16:00', label: '2:00 PM – 4:00 PM' },
  { value: '16:00-18:00', label: '4:00 PM – 6:00 PM' },
  { value: '18:00-20:00', label: '6:00 PM – 8:00 PM' },
  { value: '20:00-22:00', label: '8:00 PM – 10:00 PM' },
  { value: 'outside-hours', label: 'Outside working hours (special request)' },
] as const

const DEFAULT_SHIPPING_FEES: ShippingFee[] = [
  { id: 'ship-dokki', city: 'Dokki', fee: 50, isActive: true, sortOrder: 1 },
  { id: 'ship-mohandessin', city: 'Mohandessin', fee: 50, isActive: true, sortOrder: 2 },
  { id: 'ship-manial', city: 'Manial', fee: 50, isActive: true, sortOrder: 3 },
  { id: 'ship-zamalek', city: 'Zamalek', fee: 50, isActive: true, sortOrder: 4 },
  { id: 'ship-haram', city: 'Haram', fee: 50, isActive: true, sortOrder: 5 },
  { id: 'ship-other', city: 'Other', fee: 50, isActive: true, sortOrder: 6 },
]

function tomorrowString() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isValidDeliveryDate(date: string) {
  return Boolean(date) && date >= tomorrowString()
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

type ProductEntry = { product: import('@/types').Product; quantity: number }

function loadData(): { products: ProductEntry[]; bundles: BundleCartItem[]; total: number } {
  if (typeof window === 'undefined') return { products: [], bundles: [], total: 0 }
  const cart = getCart()
  const products = getCartProducts(cart)
  const bundles = getCartBundles(cart)
  const total = getCartTotal(cart)
  return { products, bundles, total }
}

function CheckoutLoadingState() {
  return (
    <div className="py-24 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 animate-pulse" />
    </div>
  )
}

function EmptyCheckoutState() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h1 className="text-2xl font-black text-[#171717]">Your cart is empty</h1>
      <p className="mt-2 text-gray-400 text-sm">Add some items before checking out.</p>
      <Link href="/shop-by-category" className="inline-flex mt-6 gather-btn-primary">
        Browse Products
      </Link>
    </main>
  )
}

export default function CheckoutPageClient() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState<CheckoutFormData>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false)
  const [acceptedRefundPolicy, setAcceptedRefundPolicy] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductEntry[]>([])
  const [bundles, setBundles] = useState<BundleCartItem[]>([])
  const [total, setTotal] = useState(0)
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>(DEFAULT_SHIPPING_FEES)
  const session = useCustomerSession()

  const activeShippingFees = shippingFees
    .filter((item) => item.isActive !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const selectedShippingFee = form.city
    ? activeShippingFees.find((item) => item.city.toLowerCase() === form.city.toLowerCase())
      ?? activeShippingFees.find((item) => item.city.toLowerCase() === 'other')
      ?? DEFAULT_SHIPPING_FEES[DEFAULT_SHIPPING_FEES.length - 1]
    : null
  const shippingFee = selectedShippingFee?.fee ?? 0
  const orderTotal = total + shippingFee

  useEffect(() => {
    const data = loadData()
    startTransition(() => {
      setProducts(data.products)
      setBundles(data.bundles)
      setTotal(data.total)
      if (session) {
        setForm((f) => ({
          ...f,
          firstName: session.name.split(' ')[0] || '',
          lastName: session.name.split(' ').slice(1).join(' ') || '',
          email: session.email,
        }))
        fetch(`/api/auth/customer?id=${encodeURIComponent(session.id)}`)
          .then((r) => r.json())
          .then((profile) => {
            if (profile.phone) setForm((f) => ({ ...f, phone: profile.phone }))
            if (profile.addresses?.length > 0) {
              const addr = profile.addresses.find((a: { isDefault: boolean }) => a.isDefault) || profile.addresses[0]
              setForm((f) => ({ ...f, city: addr.city, address: addr.street, phone: addr.phone || f.phone }))
            }
          })
          .catch(() => {})
      }
      setMounted(true)
    })
  }, [session])

  useEffect(() => {
    fetch('/api/shipping-fees?active=true')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setShippingFees(data)
      })
      .catch(() => {})
  }, [])

  function setFn(field: keyof CheckoutFormData, value: string) {
    const nextValue = field === 'deliveryDate' && value && value < tomorrowString() ? tomorrowString() : value

    setForm((f) => ({ ...f, [field]: nextValue }))
    setErrors((e) => ({ ...e, [field]: undefined }))
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
    else if (!isValidDeliveryDate(form.deliveryDate)) e.deliveryDate = 'Please choose tomorrow or a later date'
    if (!form.deliverySlot) e.deliverySlot = 'Required'
    setErrors(e)
    if (!acceptedPrivacyPolicy || !acceptedRefundPolicy) {
      setPolicyError('You must agree to the Privacy Policy and Refund & Returns Policy to place your order.')
      return false
    }
    setPolicyError('')
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    try {
      const items = [
        ...products.map(({ product, quantity }) => ({
          type: 'product' as const,
          productId: product.id,
          name: product.name,
          price: product.salePrice ?? product.price,
          quantity,
        })),
        ...bundles.map((bundle) => ({
          type: 'bundle' as const,
          bundleId: bundle.bundleId,
          name: bundle.name,
          price: bundle.price,
          quantity: bundle.quantity,
          productIds: bundle.productIds,
        })),
      ]

      const acceptedPoliciesAt = new Date().toISOString()
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          subtotal: total,
          shippingFee,
          total: orderTotal,
          currency: 'EGP',
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          },
          delivery: {
            city: form.city,
            address: form.address,
            date: form.deliveryDate,
            slot: form.deliverySlot,
            shippingFee,
          },
          paymentMethod: form.paymentMethod,
          notes: form.orderNotes,
          acceptedPrivacyPolicy,
          acceptedRefundPolicy,
          acceptedPoliciesAt,
        }),
      })
    } catch { /* ignore */ }

    clearCart()
    window.dispatchEvent(new Event('gather:cart-updated'))
    router.push('/checkout/success')
  }

  if (!mounted) {
    return (
      <>
        <PageTitleSection title="Checkout" />
        <CheckoutLoadingState />
      </>
    )
  }

  if (products.length === 0 && bundles.length === 0) {
    return (
      <>
        <PageTitleSection title="Checkout" />
        <EmptyCheckoutState />
      </>
    )
  }

  return (
    <>
      <PageTitleSection title="Checkout" />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <section className="gather-section p-6 rounded-3xl space-y-4">
              <h2 className="text-lg font-black text-[#171717]">Billing Details</h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="First name" error={errors.firstName}>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setFn('firstName', e.target.value)}
                    className={inputCls(!!errors.firstName)}
                    placeholder="Ahmed"
                  />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setFn('lastName', e.target.value)}
                    className={inputCls(!!errors.lastName)}
                    placeholder="Hassan"
                  />
                </Field>
              </div>

              <Field label="Email address" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setFn('email', e.target.value)}
                  className={inputCls(!!errors.email)}
                  placeholder="ahmed@example.com"
                />
              </Field>

              <Field label="Phone number" error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setFn('phone', e.target.value)}
                  className={inputCls(!!errors.phone)}
                  placeholder="+20 10 0000 0000"
                />
              </Field>

              <Field label="City / Area" error={errors.city}>
                <select
                  value={form.city}
                  onChange={(e) => setFn('city', e.target.value)}
                  className={inputCls(!!errors.city)}
                >
                  <option value="">Select your city / area</option>
                  {activeShippingFees.map((item) => (
                    <option key={item.id} value={item.city}>{item.city}</option>
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
                  onChange={(e) => setFn('address', e.target.value)}
                  className={inputCls(!!errors.address)}
                  placeholder="123 El Nasr Street, Apt 4B"
                />
              </Field>
            </section>

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
                    min={tomorrowString()}
                    onChange={(e) => setFn('deliveryDate', e.target.value)}
                    className={inputCls(!!errors.deliveryDate)}
                  />
                </Field>

                <Field label="Preferred Delivery Time" error={errors.deliverySlot}>
                  <select
                    value={form.deliverySlot}
                    onChange={(e) => setFn('deliverySlot', e.target.value)}
                    className={inputCls(!!errors.deliverySlot)}
                    disabled={!isValidDeliveryDate(form.deliveryDate)}
                  >
                    <option value="">Select preferred delivery time</option>
                    {DELIVERY_SLOTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Order Notes <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={form.orderNotes}
                onChange={(e) => setFn('orderNotes', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors resize-none"
                placeholder="Any special instructions, card message, etc."
              />
            </section>

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
                    onChange={() => !method.disabled && setFn('paymentMethod', method.value)}
                    className="accent-[#ff7a1a]"
                    disabled={method.disabled}
                  />
                  <span className="text-lg">{method.icon}</span>
                  <span className="text-sm font-semibold text-gray-700">{method.label}</span>
                </label>
              ))}
            </section>
          </div>

          <div className="lg:col-span-2">
            <div className="gather-section p-6 rounded-3xl sticky top-24 space-y-4">
              <h2 className="text-lg font-black text-[#171717]">Your Order</h2>

              <div className="space-y-3">
                {products.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 text-sm">
                    <span className="flex-1 text-gray-700 font-medium line-clamp-2">{product.name}</span>
                    <span className="shrink-0 text-gray-500">×{quantity}</span>
                    <span className="shrink-0 font-bold text-[#171717]">
                      {formatPrice((product.salePrice ?? product.price) * quantity, product.currency)}
                    </span>
                  </div>
                ))}
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="flex gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 font-medium line-clamp-1">{bundle.name}</span>
                      <span className="text-[10px] font-semibold text-[#ff7a1a]">Bundle</span>
                    </div>
                    <span className="shrink-0 text-gray-500">×{bundle.quantity}</span>
                    <span className="shrink-0 font-bold text-[#171717]">
                      {formatPrice(bundle.price * bundle.quantity, bundle.currency)}
                    </span>
                  </div>
                ))}
              </div>

              {bundles.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {bundles.map((bundle) => (
                    <div key={bundle.id} className="flex flex-wrap gap-1">
                      {bundle.productsSnapshot.map((p) => (
                        <div key={p.id} className="flex items-center gap-1 bg-gray-50 rounded-full pr-2 pl-1 py-0.5 text-[10px] text-gray-500">
                          <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                            {p.image ? (
                              <Image src={p.image} alt="" width={16} height={16} className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-[8px]">🎁</span>
                            )}
                          </span>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[rgba(255,122,26,0.15)] flex justify-between items-center">
                <span className="text-sm font-bold text-[#7a6247]">Subtotal</span>
                <span className="text-base font-black text-[#171717]">{formatPrice(total, 'EGP')}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#7a6247]">Shipping</span>
                <span className="text-sm font-black text-[#171717]">
                  {form.city ? formatPrice(shippingFee, 'EGP') : 'Select city'}
                </span>
              </div>

              <div className="pt-3 border-t border-[rgba(255,122,26,0.15)] flex justify-between items-center">
                <span className="text-sm font-bold text-[#7a6247]">Total</span>
                <span className="text-2xl font-black text-[#ff7a1a]">{formatPrice(orderTotal, 'EGP')}</span>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedPrivacyPolicy}
                    onChange={(e) => { setAcceptedPrivacyPolicy(e.target.checked); setPolicyError('') }}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40"
                  />
                  <span className="text-xs sm:text-sm text-[#7a6247] leading-relaxed">
                    I have read and agree to the{' '}
                    <Link href="/privacy-policy" className="text-[#ff7a1a] font-semibold hover:underline" target="_blank">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedRefundPolicy}
                    onChange={(e) => { setAcceptedRefundPolicy(e.target.checked); setPolicyError('') }}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-[#FE7501] focus:ring-[#FE7501]/40"
                  />
                  <span className="text-xs sm:text-sm text-[#7a6247] leading-relaxed">
                    I have read and agree to the{' '}
                    <Link href="/refund_returns" className="text-[#ff7a1a] font-semibold hover:underline" target="_blank">
                      Refund and Returns Policy
                    </Link>
                    .
                  </span>
                </label>
                {policyError && (
                  <p className="text-xs text-red-500 font-medium">{policyError}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-full bg-[#ff7a1a] text-white font-black text-base shadow-lg hover:bg-[#fe6c00] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>

    </main>
    </>
  )
}

function inputCls(hasError: boolean) {
  return `w-full min-h-[50px] rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
      : 'border-gray-200 focus:border-[#ff7a1a] focus:ring-[#ff7a1a]/20'
  }`
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

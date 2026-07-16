'use client'

import { useState, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { CheckoutFormData, BundleCartItem, ShippingFee } from '@/types'
import PageTitleSection from '@/components/PageTitleSection'
import { getCart, getCartProducts, getCartBundles, getUnavailableCartBundles, clearCart } from '@/lib/cart'
import { formatPrice } from '@/lib/data'
import { useCustomerSession } from '@/lib/customer-auth'
import { useLocale } from '@/components/LocaleProvider'

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

type ProductEntry = { product: import('@/types').Product; quantity: number; cartItem: import('@/types').ProductCartItem }

function loadData(): { products: ProductEntry[]; bundles: BundleCartItem[]; unavailableBundles: BundleCartItem[]; total: number } {
  if (typeof window === 'undefined') return { products: [], bundles: [], unavailableBundles: [], total: 0 }
  const cart = getCart()
  const products = getCartProducts(cart)
  const bundles = getCartBundles(cart)
  const unavailableBundles = getUnavailableCartBundles(cart)
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return { products, bundles, unavailableBundles, total }
}

function CheckoutLoadingState() {
  return (
    <div className="py-24 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 animate-pulse" />
    </div>
  )
}

const AR_DELIVERY_SLOTS: Record<string, string> = {
  '10:00-12:00': '١٠:٠٠ ص - ١٢:٠٠ م',
  '12:00-14:00': '١٢:٠٠ م - ٢:٠٠ م',
  '14:00-16:00': '٢:٠٠ م - ٤:٠٠ م',
  '16:00-18:00': '٤:٠٠ م - ٦:٠٠ م',
  '18:00-20:00': '٦:٠٠ م - ٨:٠٠ م',
  '20:00-22:00': '٨:٠٠ م - ١٠:٠٠ م',
  'outside-hours': 'خارج أوقات العمل (طلب خاص)',
}

function EmptyCheckoutState() {
  const { href, t } = useLocale()
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h1 className="text-2xl font-black text-[#171717]">{t('cart.empty')}</h1>
      <p className="mt-2 text-gray-400 text-sm">{t('checkout.empty')}</p>
      <Link href={href('/shop-by-category')} className="inline-flex mt-6 gather-btn-primary">
        {t('cart.continueShopping')}
      </Link>
    </main>
  )
}

export default function CheckoutPageClient() {
  const router = useRouter()
  const { locale, href, t } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [form, setForm] = useState<CheckoutFormData>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false)
  const [acceptedRefundPolicy, setAcceptedRefundPolicy] = useState(false)
  const [policyError, setPolicyError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<ProductEntry[]>([])
  const [bundles, setBundles] = useState<BundleCartItem[]>([])
  const [unavailableBundles, setUnavailableBundles] = useState<BundleCartItem[]>([])
  const [total, setTotal] = useState(0)
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>(DEFAULT_SHIPPING_FEES)
  const [couponCode, setCouponCode] = useState<string | null>(null)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
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
  const discount = couponCode ? couponDiscount : 0
  const orderTotal = Math.max(0, total + shippingFee - discount)

  useEffect(() => {
    const data = loadData()
    startTransition(() => {
      setProducts(data.products)
      setBundles(data.bundles)
      setUnavailableBundles(data.unavailableBundles)
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
        fetch(`/api/orders?email=${encodeURIComponent(session.email)}`)
          .then((r) => r.json())
          .then((orders) => {
            if (Array.isArray(orders) && orders.length > 0) {
              const lastOrder = orders[orders.length - 1]
              setForm((f) => ({
                ...f,
                city: f.city || lastOrder.delivery?.city || '',
                address: f.address || lastOrder.delivery?.address || '',
                phone: f.phone || lastOrder.customer?.phone || '',
              }))
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
    if (!form.firstName.trim()) e.firstName = locale === 'ar' ? 'مطلوب' : 'Required'
    if (!form.lastName.trim()) e.lastName = locale === 'ar' ? 'مطلوب' : 'Required'
    if (!form.email.trim()) e.email = locale === 'ar' ? 'مطلوب' : 'Required'
    if (!form.phone.trim()) e.phone = locale === 'ar' ? 'مطلوب' : 'Required'
    if (!form.city) e.city = locale === 'ar' ? 'يرجى اختيار مدينة التوصيل' : 'Please select a delivery city'
    if (!form.address.trim()) e.address = locale === 'ar' ? 'مطلوب' : 'Required'
    if (!form.deliveryDate) e.deliveryDate = locale === 'ar' ? 'مطلوب' : 'Required'
    else if (!isValidDeliveryDate(form.deliveryDate)) e.deliveryDate = locale === 'ar' ? 'يرجى اختيار الغد أو تاريخ لاحق' : 'Please choose tomorrow or a later date'
    if (!form.deliverySlot) e.deliverySlot = locale === 'ar' ? 'مطلوب' : 'Required'
    if (unavailableBundles.length > 0) e.orderNotes = locale === 'ar' ? 'قم بإزالة عروض الباقة غير المتاحة من سلتك قبل إتمام الطلب' : 'Remove unavailable bundle offers from your cart before checkout'
    setErrors(e)
    if (!acceptedPrivacyPolicy || !acceptedRefundPolicy) {
      setPolicyError(locale === 'ar'
        ? 'يجب الموافقة على سياسة الخصوصية وسياسة الاسترداد والإرجاع لتقديم طلبك.'
        : 'You must agree to the Privacy Policy and Refund & Returns Policy to place your order.')
      return false
    }
    setPolicyError('')
    return Object.keys(e).length === 0
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const items = products.map((p) => ({ productId: p.product.id, quantity: p.quantity }))
      bundles.forEach((b) => items.push({ productId: b.bundleId, quantity: b.quantity }))
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, items, customerEmail: form.email || session?.email }),
      })
      const data = await res.json()
      if (data.valid) {
        setCouponCode(code)
        setCouponDiscount(data.discount)
        setCouponInput('')
      } else {
        setCouponError(data.reason || 'Invalid coupon')
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.')
    }
    setCouponLoading(false)
  }

  function removeCoupon() {
    setCouponCode(null)
    setCouponDiscount(0)
    setCouponInput('')
    setCouponError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    try {
      const items = [
        ...products.map(({ product, quantity, cartItem }) => ({
          type: 'product' as const,
          productId: product.id,
          name: product.name,
          price: cartItem.price,
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
      const res = await fetch('/api/orders', {
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
          couponCode: couponCode || undefined,
          paymentMethod: form.paymentMethod,
          notes: form.orderNotes,
          acceptedPrivacyPolicy,
          acceptedRefundPolicy,
          acceptedPoliciesAt,
        }),
      })

      if (!res.ok) {
        setSubmitting(false)
        return
      }

      clearCart()
      window.dispatchEvent(new Event('gather:cart-updated'))
      router.push(href('/checkout/success'))
    } catch {
      setSubmitting(false)
    }
  }

  if (!mounted) {
    return (
      <>
        <PageTitleSection title={t('checkout.title')} />
        <CheckoutLoadingState />
      </>
    )
  }

  if (products.length === 0 && bundles.length === 0) {
    return (
      <>
        <PageTitleSection title={t('checkout.title')} />
        <EmptyCheckoutState />
      </>
    )
  }

  return (
    <>
      <PageTitleSection title={t('checkout.title')} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <section className="gather-section p-6 rounded-3xl space-y-4">
              <h2 className="text-lg font-black text-[#171717]">{t('checkout.billingDetails')}</h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label={t('checkout.firstName')} error={errors.firstName}>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setFn('firstName', e.target.value)}
                    className={inputCls(!!errors.firstName)}
                    placeholder={t('checkout.firstNamePlaceholder')}
                  />
                </Field>
                <Field label={t('checkout.lastName')} error={errors.lastName}>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setFn('lastName', e.target.value)}
                    className={inputCls(!!errors.lastName)}
                    placeholder={t('checkout.lastNamePlaceholder')}
                  />
                </Field>
              </div>

              <Field label={t('checkout.email')} error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setFn('email', e.target.value)}
                  className={inputCls(!!errors.email)}
                  placeholder={t('checkout.emailPlaceholder')}
                />
              </Field>

              <Field label={t('checkout.phone')} error={errors.phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setFn('phone', e.target.value)}
                  className={inputCls(!!errors.phone)}
                  placeholder={t('checkout.phonePlaceholder')}
                />
              </Field>

              <Field label={t('checkout.city')} error={errors.city}>
                <select
                  value={form.city}
                  onChange={(e) => setFn('city', e.target.value)}
                  className={inputCls(!!errors.city)}
                >
                  <option value="">{locale === 'ar' ? 'اختر مدينتك / منطقتك' : 'Select your city / area'}</option>
                  {activeShippingFees.map((item) => (
                    <option key={item.id} value={item.city}>{item.city}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[#6b4b00] bg-[#fff7df] border border-[#f1d38a] border-l-4 border-l-[#d99a00] rounded-lg px-3 py-2">
                  {locale === 'ar' ? 'المزيد من المواقع ستتوفر قريبًا.' : 'More locations will be available soon.'}
                </p>
              </Field>

              <Field label={t('checkout.address')} error={errors.address}>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setFn('address', e.target.value)}
                  className={inputCls(!!errors.address)}
                  placeholder={t('checkout.addressPlaceholder')}
                />
              </Field>
            </section>

            <section className="rounded-[14px] p-5 bg-[#fffaf2] border border-[#f2d7a2] space-y-4">
              <h2 className="text-lg font-black text-[#171717]">{t('checkout.deliveryDetails')}</h2>
              <p className="text-sm text-[#6b4b00]">
                {locale === 'ar' ? 'اختر تاريخ ووقت التوصيل المفضل لدينا لتجهيز طلبك.' : 'Choose your preferred delivery date and time slot so we can prepare your order.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label={t('checkout.deliveryDate')} error={errors.deliveryDate}>
                  <input
                    type="date"
                    value={form.deliveryDate}
                    min={tomorrowString()}
                    onChange={(e) => setFn('deliveryDate', e.target.value)}
                    className={inputCls(!!errors.deliveryDate)}
                  />
                </Field>

                <Field label={t('checkout.deliverySlot')} error={errors.deliverySlot}>
                  <select
                    value={form.deliverySlot}
                    onChange={(e) => setFn('deliverySlot', e.target.value)}
                    className={inputCls(!!errors.deliverySlot)}
                    disabled={!isValidDeliveryDate(form.deliveryDate)}
                  >
                    <option value="">{t('checkout.selectSlot')}</option>
                    {DELIVERY_SLOTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {locale === 'ar' ? AR_DELIVERY_SLOTS[s.value] ?? s.label : s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="gather-section p-6 rounded-3xl space-y-3">
              <h2 className="text-lg font-black text-[#171717]">{t('checkout.coupon')}</h2>
              {couponCode ? (
                <div className="flex items-center justify-between bg-[#f0faf0] rounded-xl px-4 py-3">
                  <div>
                    <span className="text-sm font-bold text-green-700">{couponCode}</span>
                    {couponDiscount > 0 && (
                      <span className="text-xs text-green-600 ml-2">(-{formatPrice(couponDiscount, 'EGP')})</span>
                    )}
                  </div>
                  <button type="button" onClick={removeCoupon}
                    className="text-xs font-semibold text-red-500 hover:text-red-700">
                    {t('checkout.remove')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input type="text" value={couponInput} onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError('') }}
                    placeholder={t('checkout.couponPlaceholder')}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                    disabled={couponLoading} />
                  <button type="button" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}
                    className="gather-btn-primary text-sm py-2.5 px-5 disabled:opacity-60">
                    {couponLoading ? '...' : t('checkout.apply')}
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500">{couponError}</p>}
            </section>

            <section className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                {t('checkout.orderNotes')}
              </label>
              <textarea
                value={form.orderNotes}
                onChange={(e) => setFn('orderNotes', e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors resize-none"
                placeholder={t('checkout.notesPlaceholder')}
              />
            </section>

            <section className="gather-section p-6 rounded-3xl space-y-3">
              <h2 className="text-lg font-black text-[#171717]">{t('checkout.paymentMethod')}</h2>
              {[
                { value: 'cod', label: t('checkout.cashOnDelivery'), icon: '💵' },
                { value: 'card', label: locale === 'ar' ? 'بطاقة ائتمان / خصم (قريبًا)' : 'Credit / Debit Card (coming soon)', icon: '💳', disabled: true },
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
              <h2 className="text-lg font-black text-[#171717]">{t('checkout.orderSummary')}</h2>

              <div className="space-y-3">
                {products.map(({ product, quantity, cartItem }) => (
                  <div key={product.id} className="flex gap-3 text-sm">
                    <span className="flex-1 text-gray-700 font-medium line-clamp-2">{product.name}</span>
                    <span className="shrink-0 text-gray-500">×{quantity}</span>
                    <span className="shrink-0 font-bold text-[#171717]">
                      {formatPrice(cartItem.price * quantity, product.currency)}
                    </span>
                  </div>
                ))}
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="flex gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 font-medium line-clamp-1">{bundle.name}</span>
                      <span className="text-[10px] font-semibold text-[#ff7a1a]">{t('cart.bundle')}</span>
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
                <span className="text-sm font-bold text-[#7a6247]">{t('cart.subtotal')}</span>
                <span className="text-base font-black text-[#171717]">{formatPrice(total, 'EGP')}</span>
              </div>

              {unavailableBundles.length > 0 && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                  {t('checkout.removeBundleOffer')}
                </p>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-[#7a6247]">{t('cart.shipping')}</span>
                <span className="text-sm font-black text-[#171717]">
                  {form.city ? formatPrice(shippingFee, 'EGP') : locale === 'ar' ? 'اختر المدينة' : 'Select city'}
                </span>
              </div>

              {couponCode && discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-green-700">{t('cart.discount')} ({couponCode})</span>
                  <span className="text-sm font-black text-green-700">-{formatPrice(discount, 'EGP')}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[rgba(255,122,26,0.15)] flex justify-between items-center">
                <span className="text-sm font-bold text-[#7a6247]">{t('cart.total')}</span>
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
                    {locale === 'ar' ? 'لقد قرأت وأوافق على' : 'I have read and agree to the'}{' '}
                    <Link href={href('/privacy-policy')} className="text-[#ff7a1a] font-semibold hover:underline" target="_blank">
                      {locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
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
                    {locale === 'ar' ? 'لقد قرأت وأوافق على' : 'I have read and agree to the'}{' '}
                    <Link href={href('/refund_returns')} className="text-[#ff7a1a] font-semibold hover:underline" target="_blank">
                      {locale === 'ar' ? 'سياسة الاسترداد والإرجاع' : 'Refund and Returns Policy'}
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
                {submitting ? t('checkout.placing') : t('checkout.placeOrder')}
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

'use client'

import { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { BundleCartItem, Product } from '@/types'
import PageTitleSection from '@/components/PageTitleSection'
import { addToCart, getCart, getCartProducts, getCartBundles, getUnavailableCartBundles, updateQuantity, removeFromCart } from '@/lib/cart'
import { formatPrice, getAllProducts, getDisplayPrice } from '@/lib/data'
import { getCartCoPurchaseSuggestions, type CoPurchaseOrder } from '@/lib/cart-suggestions'
import { useLocale } from '@/components/LocaleProvider'

type CartEntry = { product: import('@/types').Product; quantity: number; cartItem: import('@/types').ProductCartItem }

function loadEntries(): { products: CartEntry[]; bundles: BundleCartItem[] } {
  const cart = getCart()
  return { products: getCartProducts(cart), bundles: getCartBundles(cart) }
}

function CartLoadingState() {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 animate-pulse" />
    </div>
  )
}

function EmptyCartState() {
  const { href, t } = useLocale()
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="text-6xl mb-4">🛍️</div>
      <h1 className="text-2xl font-black text-[#171717]">{t('cart.empty')}</h1>
      <p className="mt-2 text-gray-400 text-sm">{t('cart.emptyDesc')}</p>
      <Link href={href('/shop-by-category')} className="inline-flex mt-6 gather-btn-primary">
        {t('cart.continueShopping')}
      </Link>
    </main>
  )
}

function CartUpsellCard({ product }: { product: Product }) {
  const { locale, href, t } = useLocale()
  const name = locale === 'ar' ? product.nameAr ?? product.name : product.name
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    setAdding(true)
    addToCart(product.id)
    window.dispatchEvent(new Event('gather:cart-updated'))
    setAdding(false)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="flex items-center gap-3 rounded-[18px] border border-[#f1e2d3] bg-white p-3 shadow-[0_8px_22px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-md">
      <Link
        href={href(`/products/${product.slug}`)}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[14px] bg-[#fffaf3]"
        aria-label={name}
      >
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={name}
            fill
            className="object-contain p-2"
            sizes="80px"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#7a6247]">
            {t('cart.noImage')}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={href(`/products/${product.slug}`)}
          className="line-clamp-2 text-sm font-bold leading-snug text-[#171717] hover:text-[#ff7a1a]"
        >
          {name}
        </Link>
        <p className="mt-1 text-sm font-black text-[#ff7a1a]">
          {formatPrice(getDisplayPrice(product), product.currency)}
        </p>
      </div>

      <button
        onClick={handleAdd}
        disabled={adding || product.stock === 0}
        className={`h-9 shrink-0 rounded-full px-4 text-xs font-black transition-colors ${
          added
            ? 'bg-green-500 text-white'
            : product.stock === 0
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-[#ff7a1a] text-white hover:bg-[#fe6c00]'
        }`}
        aria-label={`Add ${name} to cart`}
      >
        {added ? t('cart.added') : adding ? '...' : product.stock === 0 ? t('product.outOfStock') : t('product.addToCart')}
      </button>
    </article>
  )
}

type Props = {
  coPurchaseOrders: CoPurchaseOrder[]
}

export default function CartPageClient({ coPurchaseOrders }: Props) {
  const { locale, href, t } = useLocale()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<CartEntry[]>([])
  const [bundles, setBundles] = useState<BundleCartItem[]>([])

  useEffect(() => {
    const { products: p, bundles: b } = loadEntries()
    startTransition(() => { setProducts(p); setBundles(b); setMounted(true) })
  }, [])

  useEffect(() => {
    if (!mounted) return
    const handler = () => {
      const { products: p, bundles: b } = loadEntries()
      startTransition(() => { setProducts(p); setBundles(b) })
    }
    window.addEventListener('gather:cart-updated', handler)
    return () => window.removeEventListener('gather:cart-updated', handler)
  }, [mounted])

  if (!mounted) {
    return (
      <>
        <PageTitleSection title={t('cart.title')} />
        <CartLoadingState />
      </>
    )
  }

  if (products.length === 0 && bundles.length === 0) {
    return (
      <>
        <PageTitleSection title={t('cart.title')} />
        <EmptyCartState />
      </>
    )
  }

  const allCartItems = [
    ...products.map((e) => ({ id: e.product.id, type: 'product' as const, productId: e.product.id, name: e.product.name, slug: e.product.slug, image: e.product.images[0], price: e.cartItem.price, currency: e.product.currency, quantity: e.quantity, compareAtPrice: e.cartItem.compareAtPrice })),
    ...bundles,
  ]
  const total = allCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = products.length + bundles.length
  const suggestions = getCartCoPurchaseSuggestions({
    cartProductIds: [
      ...products.map(({ product }) => product.id),
      ...bundles.flatMap((bundle) => bundle.productIds),
    ],
    products: getAllProducts(),
    orders: coPurchaseOrders,
  })
  const unavailableBundles = getUnavailableCartBundles(bundles)
  const hasUnavailableBundles = unavailableBundles.length > 0

  function handleQty(id: string, qty: number) {
    updateQuantity(id, qty)
    window.dispatchEvent(new Event('gather:cart-updated'))
  }

  function handleRemove(id: string) {
    removeFromCart(id)
    window.dispatchEvent(new Event('gather:cart-updated'))
  }

  return (
    <>
      <PageTitleSection title={t('cart.title')} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-[#171717] mb-8">
          {t('cart.title')} ({t(itemCount === 1 ? 'cart.itemCount_one' : 'cart.itemCount_other', { count: itemCount })})
        </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {products.map(({ product, quantity, cartItem }) => (
            <div key={product.id} className="flex gap-4 p-4 rounded-2xl bg-white border border-[#f1e2d3] hover:shadow-md transition-shadow">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#f8f8f8] shrink-0">
                {product.images[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover" sizes="96px" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">🎁</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-[#171717] line-clamp-2">{product.name}</h3>
                <p className="mt-1 text-[#ff7a1a] font-black text-sm">
                  {formatPrice(cartItem.price, product.currency)}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-200 rounded-full overflow-hidden text-sm">
                    <button
                      onClick={() => handleQty(product.id, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-600"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{quantity}</span>
                    <button
                      onClick={() => handleQty(product.id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-600"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(product.id)}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium"
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-black text-sm text-[#171717]">
                  {formatPrice(cartItem.price * quantity, product.currency)}
                </p>
              </div>
            </div>
          ))}

          {bundles.map((bundle) => (
            <div key={bundle.id} className="flex gap-4 p-4 rounded-2xl bg-white border border-[#f1e2d3] hover:shadow-md transition-shadow">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#fff4e8] shrink-0 flex items-center justify-center">
                {bundle.productsSnapshot.length > 0 ? (
                  <div className="flex -space-x-3">
                    {bundle.productsSnapshot.slice(0, 3).map((p) => (
                      <div key={p.id} className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shrink-0">
                        {p.image ? (
                          <Image src={p.image} alt="" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <span className="flex items-center justify-center text-sm h-full">🎁</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#171717] line-clamp-1">{bundle.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#ff7a1a] bg-[#fff4e8] px-2 py-0.5 rounded-full shrink-0">
                    {t('cart.bundle')}
                  </span>
                </div>
                {bundle.badge && (
                  <p className="text-xs text-[#ff7a1a] font-semibold mt-0.5">{bundle.badge}</p>
                )}
                <p className="text-[#ff7a1a] font-black text-sm mt-1">
                  {formatPrice(bundle.price, bundle.currency)}
                </p>

                {bundle.productsSnapshot.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bundle.productsSnapshot.map((p) => (
                      <Link
                        key={p.id}
                        href={href(`/products/${p.slug}`)}
                        className="flex items-center gap-1 bg-gray-50 rounded-full pr-2 pl-1 py-0.5 text-[10px] text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center overflow-hidden">
                          {p.image ? (
                            <Image src={p.image} alt="" width={16} height={16} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-[8px]">🎁</span>
                          )}
                        </span>
                        <span className="truncate max-w-[80px]">{p.name}</span>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-200 rounded-full overflow-hidden text-sm">
                    <button
                      onClick={() => handleQty(bundle.id, bundle.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-600"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold">{bundle.quantity}</span>
                    <button
                      onClick={() => handleQty(bundle.id, bundle.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors font-bold text-gray-600"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(bundle.id)}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium"
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="font-black text-sm text-[#171717]">
                  {formatPrice(bundle.price * bundle.quantity, bundle.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="gather-section p-6 rounded-3xl sticky top-24">
            <h2 className="text-lg font-black text-[#171717] mb-4">{t('cart.summary')}</h2>

            <div className="space-y-2 text-sm">
              {products.map(({ product, quantity, cartItem }) => (
                <div key={product.id} className="flex justify-between gap-2 text-gray-500">
                  <span className="truncate">{product.name} × {quantity}</span>
                  <span className="shrink-0 font-medium text-gray-700">
                    {formatPrice(cartItem.price * quantity, product.currency)}
                  </span>
                </div>
              ))}
              {bundles.map((bundle) => (
                <div key={bundle.id} className="flex justify-between gap-2 text-gray-500">
                  <span className="truncate">{bundle.name} × {bundle.quantity}</span>
                  <span className="shrink-0 font-medium text-gray-700">
                    {formatPrice(bundle.price * bundle.quantity, bundle.currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[rgba(255,122,26,0.15)] flex justify-between items-center">
              <span className="font-bold text-sm text-[#7a6247]">{t('cart.subtotal')}</span>
              <span className="font-black text-xl text-[#ff7a1a]">{formatPrice(total, 'EGP')}</span>
            </div>

            <p className="mt-2 text-xs text-gray-400">{t('cart.calculatedAtCheckout')}</p>

            {hasUnavailableBundles && (
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                {t('cart.removeUnavailable')}
              </p>
            )}

            <Link
              href={hasUnavailableBundles ? '#' : href('/checkout')}
              aria-disabled={hasUnavailableBundles}
              className={`block w-full text-center mt-5 py-3.5 text-base shadow-lg ${
                hasUnavailableBundles ? 'rounded-full bg-gray-100 text-gray-400 pointer-events-none' : 'gather-btn-primary'
              }`}
            >
              {t('cart.checkout')}
            </Link>

            <Link href={href('/shop-by-category')} className="block w-full text-center mt-3 text-sm text-[#7a6247] hover:text-[#ff7a1a] font-medium transition-colors">
              ← {t('cart.continueShopping')}
            </Link>
          </div>
        </div>
      </div>

        {suggestions.length > 0 && (
          <section className="mt-12 sm:mt-14">
            <div className="mb-5">
              <h2 className="text-2xl sm:text-3xl font-black text-[#171717]">
                {t('cart.youMayLike')}
              </h2>
              <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#7a6247]">
                {t('cart.completeGathering')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {suggestions.map((product) => (
                <CartUpsellCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  )
}

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'

export const dynamic = 'force-dynamic'
import {
  getAllProducts,
  getProductBySlug,
  getCrossSellProducts,
  formatPrice,
  getDisplayPrice,
} from '@/lib/data'
import AddToCartButton from '@/components/ui/AddToCartButton'
import ProductCard from '@/components/ProductCard'
import FrequentlyBoughtTogether from '@/components/FrequentlyBoughtTogether'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return {}
  return {
    title: product.name,
    description: product.shortDescription,
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProductBySlug(slug)

  if (!product) notFound()

  const crossSells = getCrossSellProducts(product.id)
  const displayPrice = getDisplayPrice(product)
  const hasDiscount = product.salePrice !== null

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#f8f8f8]">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-8xl">🎁</div>
            )}
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-[#ff7a1a] text-white text-sm font-black px-3 py-1.5 rounded-full">
                SALE
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-xl overflow-hidden bg-[#f8f8f8] border-2 border-transparent hover:border-[#ff7a1a] transition-colors cursor-pointer"
                >
                  <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" sizes="80px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#171717] leading-tight">
              {product.name}
            </h1>
            <p className="mt-2 text-[#7a6247] text-sm leading-relaxed">
              {product.shortDescription}
            </p>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-[#ff7a1a]">
              {formatPrice(displayPrice, product.currency)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.price, product.currency)}
              </span>
            )}
          </div>

          {/* Stock */}
          {product.stock === 0 ? (
            <span className="text-red-500 font-bold text-sm">Out of stock</span>
          ) : product.stock <= 5 ? (
            <span className="text-orange-500 font-bold text-sm">Only {product.stock} left!</span>
          ) : null}

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
            {product.description}
          </p>

          {/* Delivery notice */}
          <div className="rounded-xl bg-[#fff7df] border border-[#f1d38a] border-l-4 border-l-[#d99a00] px-4 py-3 text-sm text-[#6b4b00] font-medium">
            Same-day delivery available for orders placed before 2:00 PM. Delivered across Dokki, Mohandessin, Manial, Zamalek &amp; Haram.
          </div>

          {/* Add to cart */}
          <AddToCartButton product={product} />
        </div>
      </div>

      {/* Frequently Bought Together */}
      {crossSells.length > 0 && (
        <div className="mt-16">
          <FrequentlyBoughtTogether products={crossSells} />
        </div>
      )}

      {/* You may also like */}
      {crossSells.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-black text-[#171717] mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {crossSells.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

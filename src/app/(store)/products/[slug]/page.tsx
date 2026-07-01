import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getAllProducts,
  getCategoryById,
  getProductBySlug,
  locName,
  locShortDesc,
} from '@/lib/data'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'
import ProductCard from '@/components/ProductCard'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfoPanel from '@/components/product/ProductInfoPanel'
import FrequentlyBoughtTogether from '@/components/product/FrequentlyBoughtTogether'
import ProductDescriptionReviews from '@/components/product/ProductDescriptionReviews'
import AnimatedTitle from '@/components/AnimatedTitle'
import GsapReveal from '@/components/GsapReveal'
import type { Category, Product } from '@/types'
import { isProductDiscountActive } from '@/lib/scheduled-discounts'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await getServerLocale()
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return {}
  return {
    title: locName(product, locale),
    description: locShortDesc(product, locale),
    alternates: {
      canonical: `/products/${product.slug}`,
      languages: {
        'en': `/products/${product.slug}`,
        'ar': `/ar/products/${product.slug}`,
      },
    },
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0], width: 800, height: 800, alt: locName(product, locale) }] : undefined,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const locale = await getServerLocale()
  const product = getProductBySlug(slug)

  if (!product) notFound()

  const allProducts = getAllProducts()
  const productCategories = product.categoryIds
    .map((id) => getCategoryById(id))
    .filter((item): item is Category => item !== undefined)
  const productOccasions = product.occasionIds
    .map((id) => getCategoryById(id))
    .filter((item): item is Category => item !== undefined)
  const recommendations = getFrequentlyBoughtTogetherProducts(product, allProducts, 3)
  const relatedProducts = getRelatedProducts(product, allProducts, 8)

  return (
    <main className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] gap-8 lg:gap-10 items-start">
          <ProductGallery
            images={product.images}
            productName={locName(product, locale)}
            hasDiscount={isProductDiscountActive(product)}
          />
          <ProductInfoPanel
            product={product}
            categories={productCategories}
            occasions={productOccasions}
            locale={locale}
          />
        </section>

        {recommendations.length > 0 && (
          <div className="mt-10 sm:mt-12">
            <FrequentlyBoughtTogether
              currentProduct={product}
              suggestions={recommendations}
            />
          </div>
        )}

        <div className="mt-10 sm:mt-12">
          <ProductDescriptionReviews product={product} />
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <AnimatedTitle
              as="h2"
              text={t('product.relatedProducts', locale)}
              className="text-2xl sm:text-3xl font-bold text-[#171717] mb-6"
            />
            <GsapReveal
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5"
              itemSelector="[data-reveal-item]"
            >
              {relatedProducts.map((item) => (
                <div key={item.id} data-reveal-item>
                  <ProductCard product={item} />
                </div>
              ))}
            </GsapReveal>
          </section>
        )}
      </div>
    </main>
  )
}

function getRecommendedProducts(product: Product, allProducts: Product[], limit: number): Product[] {
  const related = getRelatedProducts(product, allProducts, limit)
  if (related.length >= limit) return related.slice(0, limit)

  const featured = allProducts.filter((item) => item.id !== product.id && item.featured)
  return uniqueProducts([...related, ...featured]).slice(0, limit)
}

function getFrequentlyBoughtTogetherProducts(product: Product, allProducts: Product[], limit: number): Product[] {
  const manual = (product.frequentlyBoughtTogetherIds ?? [])
    .map((id) => allProducts.find((item) => item.id === id))
    .filter((item): item is Product => Boolean(item))
    .filter((item) => item.id !== product.id)
    .filter((item) => (item as Product & { isActive?: boolean }).isActive !== false)

  const manualProducts = uniqueProducts(manual).slice(0, limit)
  return manualProducts.length > 0 ? manualProducts : getRecommendedProducts(product, allProducts, limit)
}

function getRelatedProducts(product: Product, allProducts: Product[], limit: number): Product[] {
  const sameCategory = allProducts.filter((item) =>
    item.id !== product.id && item.categoryIds.some((id) => product.categoryIds.includes(id))
  )
  const sameOccasion = allProducts.filter((item) =>
    item.id !== product.id && item.occasionIds.some((id) => product.occasionIds.includes(id))
  )
  const fallbackFeatured = allProducts.filter((item) => item.id !== product.id && item.featured)
  return uniqueProducts([...sameCategory, ...sameOccasion, ...fallbackFeatured]).slice(0, limit)
}

function uniqueProducts(products: Product[]): Product[] {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

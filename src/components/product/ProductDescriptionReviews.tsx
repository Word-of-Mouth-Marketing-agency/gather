import type { Product } from '@/types'
import ProductRatingSummary from './ProductRatingSummary'

interface Props {
  product: Product
}

export default function ProductDescriptionReviews({ product }: Props) {
  const reviews = product.reviews ?? []

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6">
      <div className="rounded-[28px] border border-[#ead8c4] bg-white p-5 sm:p-7">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#171717]">Description</h2>
        {product.description ? (
          <p className="mt-4 text-base font-semibold leading-8 text-[#5f4b36]">
            {product.description}
          </p>
        ) : (
          <p className="mt-4 text-base font-semibold text-[#7a6247]">
            More details for this product are coming soon.
          </p>
        )}
      </div>

      <div className="rounded-[28px] border border-[#ead8c4] bg-[#fffaf3] p-5 sm:p-7">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#171717]">Reviews / Ratings</h2>
        <div className="mt-4">
          <ProductRatingSummary rating={product.rating} reviewCount={product.reviewCount} compact />
        </div>

        {reviews.length > 0 ? (
          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl bg-white p-4 border border-[#ead8c4]">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-[#171717]">{review.title ?? review.author}</h3>
                  <span className="text-sm font-black text-[#FE7501]">{review.rating.toFixed(1)}</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#7a6247]">{review.body}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white px-4 py-5 text-sm font-bold text-[#7a6247] border border-[#ead8c4]">
            No reviews yet.
          </p>
        )}
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect } from 'react'
import type { Product, Review } from '@/types'
import ProductRatingSummary from './ProductRatingSummary'
import { useCustomerSession } from '@/lib/customer-auth'

interface Props {
  product: Product
}

export default function ProductDescriptionReviews({ product }: Props) {
  const session = useCustomerSession()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')

  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}&status=approved&isVisible=true`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [product.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerId: session.id,
          customerName: session.name,
          customerEmail: session.email,
          rating,
          title: title || undefined,
          comment,
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        setShowForm(false)
        setRating(5)
        setTitle('')
        setComment('')
      }
    } catch {
      // silently fail
    }
    setSubmitting(false)
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

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
          <ProductRatingSummary
            rating={averageRating}
            reviewCount={reviews.length}
            compact
          />
        </div>

        {submitted && (
          <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200">
            <p className="text-sm font-bold text-green-700">
              Your review has been submitted and is pending approval.
            </p>
          </div>
        )}

        {session && !submitted && (
          <div className="mt-5">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-2xl bg-[#ff7a1a] text-white font-bold text-sm hover:bg-[#e06c0f] transition-colors"
              >
                Write a Review
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-2xl bg-white border border-[#ead8c4]">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-2 block">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-0.5"
                      >
                        <svg
                          className={`w-6 h-6 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Title (optional)</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Summarize your review"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Comment</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    rows={3}
                    placeholder="Share your experience with this product"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-[#ff7a1a] text-white text-sm font-bold hover:bg-[#e06c0f] disabled:opacity-50 transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {!session && (
          <div className="mt-5 p-4 rounded-2xl bg-white border border-[#ead8c4] text-center">
            <p className="text-sm font-bold text-gray-700 mb-2">
              Want to write a review?
            </p>
            <a
              href="/login"
              className="text-sm font-bold text-[#ff7a1a] hover:underline"
            >
              Log in to your account
            </a>
          </div>
        )}

        {loading ? (
          <div className="mt-5 space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-4 border border-[#ead8c4]">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="mt-5 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-2xl bg-white p-4 border border-[#ead8c4]">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-[#171717] text-sm">
                      {review.title || review.customerName}
                    </h3>
                    {review.title && (
                      <span className="text-xs text-gray-400">by {review.customerName}</span>
                    )}
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-sm font-semibold leading-6 text-[#7a6247]">{review.comment}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl bg-white px-4 py-5 text-sm font-bold text-[#7a6247] border border-[#ead8c4]">
            No reviews yet. Be the first to review this product!
          </p>
        )}
      </div>
    </section>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
    </span>
  )
}
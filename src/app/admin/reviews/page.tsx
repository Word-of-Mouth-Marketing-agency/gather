'use client'

import { useState, useEffect } from 'react'
import type { Review, ReviewStatus } from '@/types'
import { getAllProducts } from '@/lib/data'
import type { Product } from '@/types'
import StarRating from '@/components/StarRating'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products] = useState<Product[]>(getAllProducts())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        setReviews(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product?.name || 'Unknown Product'
  }

  const updateReview = async (id: string, updates: Partial<Review>) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)))
    }
  }

  const deleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review? This cannot be undone.')) {
      return
    }
    const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== id))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage product reviews</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-96" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Reviews</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage product reviews and moderation</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">All Reviews</h2>
          <p className="text-xs text-gray-400 mt-0.5">{reviews.length} total reviews</p>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm">No reviews yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map((review) => (
              <div key={review.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-900 truncate">
                        {getProductName(review.productId)}
                      </span>
                      <StatusBadge status={review.status} />
                      <VisibilityBadge isVisible={review.isVisible} />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                      <span className="font-medium">{review.customerName}</span>
                      <span>·</span>
                      <span>{review.customerEmail}</span>
                      <span>·</span>
                      <StarRating rating={review.rating} />
                      <span>·</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>

                    {review.title && (
                      <p className="text-sm font-bold text-gray-900 mb-1">{review.title}</p>
                    )}
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReview(review.id, { status: 'approved', isVisible: true })}
                            className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors"
                            title="Approve"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateReview(review.id, { status: 'rejected' })}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors"
                            title="Reject"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {review.status === 'approved' && (
                        <button
                          onClick={() => updateReview(review.id, { isVisible: !review.isVisible })}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            review.isVisible
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                          title={review.isVisible ? 'Hide' : 'Show'}
                        >
                          {review.isVisible ? 'Hide' : 'Show'}
                        </button>
                      )}
                      {review.status === 'rejected' && (
                        <button
                          onClick={() => updateReview(review.id, { status: 'approved', isVisible: true })}
                          className="px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold hover:bg-green-100 transition-colors"
                          title="Approve"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  const styles = {
    pending: 'bg-yellow-50 text-yellow-600',
    approved: 'bg-green-50 text-green-600',
    rejected: 'bg-red-50 text-red-600',
  }

  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status}
    </span>
  )
}

function VisibilityBadge({ isVisible }: { isVisible: boolean }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
      isVisible ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
    }`}>
      {isVisible ? 'visible' : 'hidden'}
    </span>
  )
}

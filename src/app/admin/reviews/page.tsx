'use client'

import { useState, useEffect } from 'react'
import type { Review, ReviewStatus } from '@/types'
import { getAllProducts } from '@/lib/data'
import type { Product } from '@/types'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [products] = useState<Product[]>(getAllProducts())
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editComment, setEditComment] = useState('')

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

  const startEdit = (review: Review) => {
    setEditingId(review.id)
    setEditTitle(review.title || '')
    setEditComment(review.comment)
  }

  const saveEdit = async (id: string) => {
    await updateReview(id, { title: editTitle, comment: editComment })
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditComment('')
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

                    {editingId === review.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Title (optional)"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a]"
                        />
                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] resize-none"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEdit(review.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#ff7a1a] text-white text-xs font-bold hover:bg-[#e06c0f] transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {review.title && (
                          <p className="text-sm font-bold text-gray-900 mb-1">{review.title}</p>
                        )}
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      </>
                    )}
                  </div>

                  {editingId !== review.id && (
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
                        onClick={() => startEdit(review)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
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
                  )}
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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}
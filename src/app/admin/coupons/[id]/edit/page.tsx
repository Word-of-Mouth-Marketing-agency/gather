'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import CouponForm from '../../CouponForm'
import type { Coupon } from '@/types'

export default function EditCouponPage() {
  const { id } = useParams<{ id: string }>()
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/coupons/${id}`).then(async (res) => {
      if (res.ok) setCoupon(await res.json())
      else setError('Coupon not found')
      setLoading(false)
    }).catch(() => { setError('Failed to load'); setLoading(false) })
  }, [id])

  if (loading) return <div className="text-sm text-gray-400 p-6">Loading...</div>
  if (error || !coupon) return <div className="text-sm text-red-500 p-6">{error || 'Not found'}</div>

  return <CouponForm initialData={coupon} />
}

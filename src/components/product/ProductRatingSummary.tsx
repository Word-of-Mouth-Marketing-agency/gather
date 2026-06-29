import StarRating from '@/components/StarRating'

interface Props {
  rating?: number | null
  reviewCount?: number
  compact?: boolean
}

export default function ProductRatingSummary({ rating, reviewCount, compact = false }: Props) {
  if (rating == null || rating === 0) return null

  const count = reviewCount ?? 0
  const rounded = Math.round(rating)

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <StarRating rating={rounded} size="md" />
      <span className="font-bold text-[#171717]">{rating.toFixed(1)}</span>
      <span className="text-[#7a6247]">
        {count > 0 ? `${count} ${compact ? 'reviews' : 'customer reviews'}` : ''}
      </span>
    </div>
  )
}
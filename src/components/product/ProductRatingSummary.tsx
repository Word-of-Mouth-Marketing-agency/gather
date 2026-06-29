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
      <div className="flex items-center text-[#FE7501]" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <svg
            key={index}
            viewBox="0 0 20 20"
            className={`h-4 w-4 ${index < rounded ? 'fill-current' : 'fill-none stroke-current'}`}
            aria-hidden="true"
          >
            <path d="M10 1.7l2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.6-5 2.6 1-5.6-4.1-4 5.6-.8L10 1.7z" />
          </svg>
        ))}
      </div>
      <span className="font-bold text-[#171717]">{rating.toFixed(1)}</span>
      <span className="text-[#7a6247]">
        {count > 0 ? `${count} ${compact ? 'reviews' : 'customer reviews'}` : ''}
      </span>
    </div>
  )
}
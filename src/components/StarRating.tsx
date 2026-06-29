'use client'

import type { ButtonHTMLAttributes } from 'react'

interface Props {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

const SIZES = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-6 h-6' } as const

function Star({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 2}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export default function StarRating({ rating, size = 'md', interactive, onChange }: Props) {
  const sizeClass = SIZES[size]

  if (interactive && onChange) {
    return (
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-0.5 rounded transition-colors hover:scale-110 ${
              star <= rating ? 'text-[#fbbf24]' : 'text-gray-200 hover:text-[#fbbf24]/40'
            }`}
            role="radio"
            aria-checked={star === rating}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star filled={star <= rating} className={sizeClass} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          filled={star <= rating}
          className={`${sizeClass} ${star <= rating ? 'text-[#fbbf24]' : 'text-gray-200'}`}
        />
      ))}
    </span>
  )
}

interface InteractiveStarRatingProps extends Omit<ButtonHTMLAttributes<HTMLDivElement>, 'onChange'> {
  rating: number
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

export function InteractiveStarRating({ rating, onChange, size = 'lg', ...rest }: InteractiveStarRatingProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating" {...rest}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-0.5 rounded transition-colors hover:scale-110 ${
            star <= rating ? 'text-[#fbbf24]' : 'text-gray-200 hover:text-[#fbbf24]/40'
          }`}
          role="radio"
          aria-checked={star === rating}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star filled={star <= rating} className={SIZES[size] ?? SIZES.lg} />
        </button>
      ))}
    </div>
  )
}
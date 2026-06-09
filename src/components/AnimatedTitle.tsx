'use client'

import { ElementType, useMemo, useRef } from 'react'
import { useGsapReveal } from '@/lib/useGsapReveal'

interface Props {
  as?: ElementType
  text: string
  accentWord?: string
  className?: string
  accentClassName?: string
}

export default function AnimatedTitle({
  as: Tag = 'h2',
  text,
  accentWord,
  className,
  accentClassName = 'text-[#FE7501]',
}: Props) {
  const ref = useRef<HTMLElement>(null)
  const tokens = useMemo(() => text.split(/(\s+)/), [text])

  useGsapReveal(ref, {
    targets: '[data-title-word-inner]',
    y: 28,
    stagger: 0.045,
    duration: 0.62,
  })

  return (
    <Tag ref={ref} className={className}>
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token)) return token
        const isAccent = accentWord ? token.toLowerCase() === accentWord.toLowerCase() : false

        return (
          <span key={`${token}-${index}`} className="inline-block overflow-hidden align-bottom">
            <span
              data-title-word-inner
              className={`inline-block will-change-transform ${isAccent ? accentClassName : ''}`}
            >
              {token}
            </span>
          </span>
        )
      })}
    </Tag>
  )
}

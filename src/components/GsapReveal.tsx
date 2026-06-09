'use client'

import { CSSProperties, ReactNode, useRef } from 'react'
import { useGsapReveal } from '@/lib/useGsapReveal'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  itemSelector?: string
  amount?: number
  y?: number
  stagger?: number
}

export default function GsapReveal({
  children,
  className,
  style,
  itemSelector,
  amount = 0.2,
  y = 24,
  stagger = 0.07,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGsapReveal(ref, {
    targets: itemSelector,
    amount,
    y,
    stagger,
    duration: 0.58,
  })

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}

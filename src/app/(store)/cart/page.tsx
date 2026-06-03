import type { Metadata } from 'next'
import CartPageClient from '@/components/CartPageClient'

export const metadata: Metadata = {
  title: 'Cart',
}

export default function CartPage() {
  return <CartPageClient />
}

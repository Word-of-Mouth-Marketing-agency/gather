import type { Metadata } from 'next'
import WishlistPageClient from './WishlistPageClient'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'View and manage your saved wishlist items at Gather.',
}

export default function WishlistPage() {
  return <WishlistPageClient />
}

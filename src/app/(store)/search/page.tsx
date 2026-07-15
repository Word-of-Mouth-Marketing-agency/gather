import type { Metadata } from 'next'
import SearchPageClient from './SearchPageClient'

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search for gifts, cakes, decorations, and more at Gather.',
}

export default function SearchPage() {
  return <SearchPageClient />
}

import type { Metadata } from 'next'
import OrdersPageClient from './OrdersPageClient'

export const metadata: Metadata = {
  title: 'My Orders',
  description: 'View your order history and track deliveries at Gather.',
}

export default function OrdersPage() {
  return <OrdersPageClient />
}

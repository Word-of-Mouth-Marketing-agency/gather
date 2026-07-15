import type { Metadata } from 'next'
import AddressesPageClient from './AddressesPageClient'

export const metadata: Metadata = {
  title: 'My Addresses',
  description: 'Manage your saved delivery addresses for faster checkout at Gather.',
}

export default function AddressesPage() {
  return <AddressesPageClient />
}

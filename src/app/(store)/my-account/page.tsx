import type { Metadata } from 'next'
import MyAccountPageClient from './MyAccountPageClient'

export const metadata: Metadata = {
  title: 'My Account',
  description: 'Manage your Gather account, view orders, and update your profile.',
}

export default function MyAccountPage() {
  return <MyAccountPageClient />
}

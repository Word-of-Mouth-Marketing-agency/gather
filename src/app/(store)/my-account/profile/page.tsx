import type { Metadata } from 'next'
import ProfilePageClient from './ProfilePageClient'

export const metadata: Metadata = {
  title: 'My Profile',
  description: 'Update your Gather account profile information.',
}

export default function ProfilePage() {
  return <ProfilePageClient />
}

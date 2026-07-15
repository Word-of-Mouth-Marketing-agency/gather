import type { Metadata } from 'next'
import LoginPageClient from './LoginPageClient'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Gather account to manage orders, addresses, and preferences.',
}

export default function LoginPage() {
  return <LoginPageClient />
}

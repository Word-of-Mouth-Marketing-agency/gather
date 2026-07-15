import type { Metadata } from 'next'
import SignupPageClient from './SignupPageClient'

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create a Gather account to enjoy faster checkout, order tracking, and exclusive offers.',
}

export default function SignupPage() {
  return <SignupPageClient />
}

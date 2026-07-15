import type { Metadata } from 'next'
import ForgotPasswordPageClient from './ForgotPasswordPageClient'

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your Gather account password. Enter your email to receive a password reset link.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />
}

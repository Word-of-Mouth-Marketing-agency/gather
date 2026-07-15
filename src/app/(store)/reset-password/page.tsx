import type { Metadata } from 'next'
import ResetPasswordPageClient from './ResetPasswordPageClient'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your Gather account.',
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />
}

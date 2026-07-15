export function getSiteUrl(): string {
  return (process.env.SITE_URL || 'https://gather-eg.com').replace(/\/+$/, '')
}

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gather-eg.com',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
}

export default nextConfig

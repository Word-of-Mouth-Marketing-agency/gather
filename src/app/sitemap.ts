import type { MetadataRoute } from 'next'
import { getAllProducts, getAllCategories } from '@/lib/data'

const BASE_URL = 'https://gather-eg.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const products = getAllProducts()
  const categories = getAllCategories()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shop-by-category`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/shop-by-occasion`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/refund_returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    // Arabic routes
    { url: `${BASE_URL}/ar`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/ar/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/ar/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/ar/shop-by-category`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/ar/shop-by-occasion`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/ar/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/ar/refund_returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.flatMap((p) => [
    {
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/ar/products/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ])

  const categoryRoutes: MetadataRoute.Sitemap = categories
    .filter((c) => c.isActive !== false)
    .flatMap((c) => [
      {
        url: `${BASE_URL}/shop-by-category?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: c.type === 'category' ? 0.6 : 0.5,
      },
      {
        url: `${BASE_URL}/ar/shop-by-category?category=${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: c.type === 'category' ? 0.6 : 0.5,
      },
    ])

  return [...staticRoutes, ...productRoutes, ...categoryRoutes]
}

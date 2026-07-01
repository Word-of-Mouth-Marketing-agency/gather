import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const query = q.toLowerCase()
  const all = getAllProducts()

  const results = all
    .filter((p) => {
      if (p.name.toLowerCase().includes(query)) return true
      if (p.nameAr?.toLowerCase().includes(query)) return true
      if (p.slug.toLowerCase().includes(query)) return true
      return false
    })
    .slice(0, 8)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      nameAr: p.nameAr ?? null,
      price: p.price,
      salePrice: p.salePrice,
      image: p.images[0] ?? null,
      currency: p.currency,
      categoryIds: p.categoryIds,
    }))

  return NextResponse.json(results)
}

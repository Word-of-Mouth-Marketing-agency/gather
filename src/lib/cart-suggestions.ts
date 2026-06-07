import type { Product, CartItem } from '@/types'
import { getAllProducts } from './data'

export interface Suggestion {
  product: Product
  checked: boolean
}

export function getCartSuggestions(cart: CartItem[]): Product[] {
  const all = getAllProducts()
  const inCartIds = new Set(
    cart.map((item) => (item.type === 'product' ? item.productId : null)).filter(Boolean)
  )

  const candidateIds = new Set<string>()

  for (const item of cart) {
    if (item.type === 'product') {
      const product = all.find((p) => p.id === item.productId)
      if (!product) continue
      for (const p of all) {
        if (inCartIds.has(p.id)) continue
        const sharesCategory = p.categoryIds.some((c) => product.categoryIds.includes(c))
        const sharesOccasion = p.occasionIds.some((o) => product.occasionIds.includes(o))
        if (sharesCategory || sharesOccasion) {
          candidateIds.add(p.id)
        }
      }
    }
  }

  const candidates = all.filter((p) => candidateIds.has(p.id))
  if (candidates.length > 0) return candidates.slice(0, 4)

  return all.filter((p) => p.featured && !inCartIds.has(p.id)).slice(0, 4)
}

import type { Product } from '@/types'

export type CoPurchaseOrder = {
  productIds: string[]
}

type SuggestionOptions = {
  cartProductIds: string[]
  products: Product[]
  orders: CoPurchaseOrder[]
  limit?: number
}

function isAvailableProduct(product: Product): boolean {
  return (product as Product & { isActive?: boolean }).isActive !== false
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))]
}

function uniqueProducts(products: Product[]): Product[] {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (seen.has(product.id)) return false
    seen.add(product.id)
    return true
  })
}

function orderSalesCounts(orders: CoPurchaseOrder[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const order of orders) {
    for (const productId of uniqueIds(order.productIds)) {
      counts.set(productId, (counts.get(productId) ?? 0) + 1)
    }
  }
  return counts
}

function productSalesScore(product: Product, orderCounts: Map<string, number>): number {
  return product.soldCount ?? product.orderCount ?? orderCounts.get(product.id) ?? 0
}

function fallbackSort(orderCounts: Map<string, number>) {
  return (a: Product, b: Product) => {
    const salesDiff = productSalesScore(b, orderCounts) - productSalesScore(a, orderCounts)
    if (salesDiff !== 0) return salesDiff

    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    if (orderDiff !== 0) return orderDiff

    return a.name.localeCompare(b.name)
  }
}

export function getCartCoPurchaseSuggestions({
  cartProductIds,
  products,
  orders,
  limit = 4,
}: SuggestionOptions): Product[] {
  const cartIds = new Set(uniqueIds(cartProductIds))
  if (cartIds.size === 0) return []

  const orderCounts = orderSalesCounts(orders)
  const productsById = new Map(products.filter(isAvailableProduct).map((product) => [product.id, product]))
  const scores = new Map<string, number>()

  for (const order of orders) {
    const orderProductIds = uniqueIds(order.productIds)
    const matchCount = orderProductIds.filter((productId) => cartIds.has(productId)).length
    if (matchCount === 0) continue

    for (const productId of orderProductIds) {
      if (cartIds.has(productId)) continue
      if (!productsById.has(productId)) continue
      scores.set(productId, (scores.get(productId) ?? 0) + matchCount)
    }
  }

  const coPurchased = [...scores.entries()]
    .sort(([aId, aScore], [bId, bScore]) => {
      if (bScore !== aScore) return bScore - aScore

      const a = productsById.get(aId)
      const b = productsById.get(bId)
      if (!a || !b) return 0
      return fallbackSort(orderCounts)(a, b)
    })
    .map(([productId]) => productsById.get(productId))
    .filter((product): product is Product => Boolean(product))

  if (coPurchased.length >= limit) return coPurchased.slice(0, limit)

  const cartProducts = [...cartIds]
    .map((productId) => productsById.get(productId))
    .filter((product): product is Product => Boolean(product))
  const categoryIds = new Set(cartProducts.flatMap((product) => product.categoryIds))
  const occasionIds = new Set(cartProducts.flatMap((product) => product.occasionIds))
  const availableProducts = products
    .filter(isAvailableProduct)
    .filter((product) => !cartIds.has(product.id))
    .filter((product) => !scores.has(product.id))

  const sameCategory = availableProducts
    .filter((product) => product.categoryIds.some((id) => categoryIds.has(id)))
    .sort(fallbackSort(orderCounts))
  const sameOccasion = availableProducts
    .filter((product) => product.occasionIds.some((id) => occasionIds.has(id)))
    .sort(fallbackSort(orderCounts))
  const featured = availableProducts
    .filter((product) => product.featured)
    .sort(fallbackSort(orderCounts))
  const topSold = availableProducts.sort(fallbackSort(orderCounts))

  return uniqueProducts([...coPurchased, ...sameCategory, ...sameOccasion, ...featured, ...topSold]).slice(0, limit)
}

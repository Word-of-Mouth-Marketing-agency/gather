import type { Category, Product } from '@/types'
import { getAllOrders } from './orders'

function productBaseOrder(product: Product): number {
  return product.sortOrder ?? 0
}

function getOrderSalesCounts(): Map<string, number> {
  const counts = new Map<string, number>()

  for (const order of getAllOrders()) {
    if (order.status === 'cancelled') continue

    for (const item of order.items) {
      if (item.type === 'product') {
        counts.set(item.productId, (counts.get(item.productId) ?? 0) + item.quantity)
      } else {
        for (const productId of item.productIds) {
          counts.set(productId, (counts.get(productId) ?? 0) + item.quantity)
        }
      }
    }
  }

  return counts
}

function salesCount(product: Product, orderSalesCounts: Map<string, number>): number {
  return product.soldCount ?? product.orderCount ?? orderSalesCounts.get(product.id) ?? 0
}

function salesThenFallbackSort(orderSalesCounts: Map<string, number>) {
  return (a: Product, b: Product) => {
    const salesDiff = salesCount(b, orderSalesCounts) - salesCount(a, orderSalesCounts)
    if (salesDiff !== 0) return salesDiff

    const orderDiff = productBaseOrder(a) - productBaseOrder(b)
    if (orderDiff !== 0) return orderDiff

    return a.name.localeCompare(b.name)
  }
}

export function sortProductsForTaxonomy(products: Product[], taxonomy?: Category): Product[] {
  if (!taxonomy) return products

  const productsById = new Map(products.map((product) => [product.id, product]))
  const manualProducts = (taxonomy.topProductIds ?? [])
    .slice(0, 10)
    .map((id) => productsById.get(id))
    .filter((product): product is Product => Boolean(product))

  const manualIds = new Set(manualProducts.map((product) => product.id))
  const orderSalesCounts = getOrderSalesCounts()
  const remainingProducts = products
    .filter((product) => !manualIds.has(product.id))
    .sort(salesThenFallbackSort(orderSalesCounts))

  return [...manualProducts, ...remainingProducts]
}

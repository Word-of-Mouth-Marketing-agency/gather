import type { Metadata } from 'next'
import CartPageClient from '@/components/CartPageClient'
import type { CoPurchaseOrder } from '@/lib/cart-suggestions'
import { getAllOrders } from '@/lib/orders'

export const metadata: Metadata = {
  title: 'Cart',
}

export const dynamic = 'force-dynamic'

function getCoPurchaseOrders(): CoPurchaseOrder[] {
  return getAllOrders()
    .filter((order) => order.status !== 'cancelled')
    .map((order) => ({
      productIds: [
        ...new Set(order.items.flatMap((item) =>
          item.type === 'product' ? [item.productId] : item.productIds
        )),
      ],
    }))
    .filter((order) => order.productIds.length > 1)
}

export default function CartPage() {
  return <CartPageClient coPurchaseOrders={getCoPurchaseOrders()} />
}

import type { Metadata } from 'next'
import CartPageClient from '@/components/CartPageClient'
import type { CoPurchaseOrder } from '@/lib/cart-suggestions'
import { getAllOrders } from '@/lib/orders'
import { getServerLocale } from '@/lib/locale-server'
import { t } from '@/lib/translations'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale()
  return {
    title: t('meta.cart', locale),
  }
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

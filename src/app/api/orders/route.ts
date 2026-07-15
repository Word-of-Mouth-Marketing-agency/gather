import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin-api'
import { getAllOrders, createOrder, updateOrderStatus, type Order, reserveAdminEmail, reserveCustomerEmail, commitAdminEmailSent, commitCustomerEmailSent, markEmailFailed } from '@/lib/orders'
import { getShippingFeeForCity } from '@/lib/shipping-fees'
import { upsertCustomerFromCheckout } from '@/lib/customer-data'
import { getCustomerSessionCookie } from '@/lib/customer-session'
import { syncOrderAfterCheckout } from '@/lib/odoo/order-sync'
import { syncPartnerFromCustomer } from '@/lib/odoo/partner-sync'
import { isOdooSyncEnabled } from '@/lib/odoo/json-rpc'
import { sendMail, sendAdminNotification } from '@/lib/mail'
import { getSiteUrl } from '@/lib/site-url'
import { rateLimit } from '@/lib/rate-limit'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

function safe(val: unknown): string {
  if (val === null || val === undefined) return ''
  return escapeHtml(String(val))
}

function formatPrice(amount: number): string {
  return `${Number(amount).toFixed(2)} EGP`
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

async function sendOrderNotifications(order: Order) {
  const siteUrl = getSiteUrl()

  const adminReserved = reserveAdminEmail(order.id)
  const adminLink = `${siteUrl}/admin/orders`
  const itemsHtml = order.items.map((item) => {
    const name = 'name' in item ? safe(item.name) : 'Unknown'
    const price = 'price' in item ? Number(item.price) : 0
    const qty = 'quantity' in item ? Number(item.quantity) : 1
    const total = (price * qty).toFixed(2)
    return `<tr><td style="padding:8px;border:1px solid #ddd">${name}</td><td style="padding:8px;border:1px solid #ddd;text-align:center">${qty}</td><td style="padding:8px;border:1px solid #ddd;text-align:right">${total} EGP</td></tr>`
  }).join('\n')

  const deliveryHtml = [
    `<tr><td style="padding:8px;background:#f9f9f9;border:1px solid #ddd">City</td><td style="padding:8px;border:1px solid #ddd">${safe(order.delivery.city)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f9f9f9;border:1px solid #ddd">Address</td><td style="padding:8px;border:1px solid #ddd">${safe(order.delivery.address)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f9f9f9;border:1px solid #ddd">Date</td><td style="padding:8px;border:1px solid #ddd">${safe(order.delivery.date)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f9f9f9;border:1px solid #ddd">Slot</td><td style="padding:8px;border:1px solid #ddd">${safe(order.delivery.slot)}</td></tr>`,
  ].join('\n')

  const adminText = [
    `New Order: ${order.orderNumber}`,
    `Customer: ${order.customer.firstName} ${order.customer.lastName}`,
    `Email: ${order.customer.email}`,
    `Phone: ${order.customer.phone}`,
    `City: ${order.delivery.city}`,
    `Address: ${order.delivery.address}`,
    `Delivery Date: ${order.delivery.date} ${order.delivery.slot}`,
    `Payment: ${order.paymentMethod}`,
    ``,
    `Items:`,
    ...order.items.map((item) => {
      const name = 'name' in item ? item.name : 'Unknown'
      const price = 'price' in item ? Number(item.price) : 0
      const qty = 'quantity' in item ? Number(item.quantity) : 1
      return `  ${name} x${qty} = ${(price * qty).toFixed(2)} EGP`
    }),
    ``,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Delivery Fee: ${formatPrice(order.shippingFee || 0)}`,
    `Total: ${formatPrice(order.total)}`,
    `Admin: ${adminLink}`,
  ].join('\n')

  const adminHtml = [
    '<div style="font-family:sans-serif;max-width:600px">',
    `<h2 style="color:#ff7a1a">New Order: ${safe(order.orderNumber)}</h2>`,
    '<table style="border-collapse:collapse;width:100%">',
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd;width:140px">Order</td><td style="padding:8px;border:1px solid #ddd">${safe(order.orderNumber)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Customer</td><td style="padding:8px;border:1px solid #ddd">${safe(order.customer.firstName)} ${safe(order.customer.lastName)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Email</td><td style="padding:8px;border:1px solid #ddd">${safe(order.customer.email)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Phone</td><td style="padding:8px;border:1px solid #ddd">${safe(order.customer.phone)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Payment</td><td style="padding:8px;border:1px solid #ddd">${safe(order.paymentMethod)}</td></tr>`,
    '</table>',
    '<h3 style="margin-top:20px">Delivery</h3>',
    '<table style="border-collapse:collapse;width:100%">',
    deliveryHtml,
    '</table>',
    '<h3 style="margin-top:20px">Items</h3>',
    '<table style="border-collapse:collapse;width:100%">',
    '<tr style="background:#f5f0e9"><th style="padding:8px;border:1px solid #ddd;text-align:left">Item</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Qty</th><th style="padding:8px;border:1px solid #ddd;text-align:right">Price</th></tr>',
    itemsHtml,
    '</table>',
    '<table style="border-collapse:collapse;width:100%;margin-top:10px">',
    `<tr><td style="padding:8px;border:1px solid #ddd;text-align:right;width:80%"><strong>Subtotal</strong></td><td style="padding:8px;border:1px solid #ddd;text-align:right">${formatPrice(order.subtotal)}</td></tr>`,
    `<tr><td style="padding:8px;border:1px solid #ddd;text-align:right;width:80%"><strong>Delivery Fee</strong></td><td style="padding:8px;border:1px solid #ddd;text-align:right">${formatPrice(order.shippingFee || 0)}</td></tr>`,
    `<tr><td style="padding:8px;border:1px solid #ddd;text-align:right;width:80%;font-size:1.1em"><strong>Total</strong></td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-size:1.1em;font-weight:bold;color:#ff7a1a">${formatPrice(order.total)}</td></tr>`,
    '</table>',
    `<p style="margin-top:20px"><a href="${safe(adminLink)}" style="background:#ff7a1a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block">View in Admin</a></p>`,
    '</div>',
  ].join('\n')

  if (reserveAdminEmail(order.id)) {
    const adminOk = await sendAdminNotification({
      subject: `[Gather Order] ${order.orderNumber}`,
      text: adminText,
      html: adminHtml,
    })
    if (adminOk) {
      commitAdminEmailSent(order.id)
    } else {
      markEmailFailed(order.id, 'admin_email_failed')
    }
  }

  const customerReserved = reserveCustomerEmail(order.id)
  const customerText = [
    `Thank you for your order, ${order.customer.firstName}!`,
    ``,
    `Order: ${order.orderNumber}`,
    `Date: ${formatDate(order.createdAt)}`,
    ``,
    `Items:`,
    ...order.items.map((item) => {
      const name = 'name' in item ? item.name : 'Unknown'
      const price = 'price' in item ? Number(item.price) : 0
      const qty = 'quantity' in item ? Number(item.quantity) : 1
      return `  ${name} x${qty} = ${(price * qty).toFixed(2)} EGP`
    }),
    ``,
    `Subtotal: ${formatPrice(order.subtotal)}`,
    `Delivery Fee: ${formatPrice(order.shippingFee || 0)}`,
    `Total: ${formatPrice(order.total)}`,
    `Payment: ${order.paymentMethod}`,
    ``,
    `Delivery: ${order.delivery.city} - ${order.delivery.address}`,
    `Scheduled: ${order.delivery.date} ${order.delivery.slot}`,
    ``,
    `If you have any questions, contact us at info@gather-eg.com`,
  ].join('\n')

  const customerHtml = [
    '<div style="font-family:sans-serif;max-width:600px">',
    `<h2 style="color:#ff7a1a">Thank you, ${safe(order.customer.firstName)}!</h2>`,
    `<p>Your order <strong>${safe(order.orderNumber)}</strong> has been received.</p>`,
    '<h3 style="margin-top:20px">Order Summary</h3>',
    '<table style="border-collapse:collapse;width:100%">',
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Order</td><td style="padding:8px;border:1px solid #ddd">${safe(order.orderNumber)}</td></tr>`,
    `<tr><td style="padding:8px;background:#f5f0e9;font-weight:bold;border:1px solid #ddd">Date</td><td style="padding:8px;border:1px solid #ddd">${formatDate(order.createdAt)}</td></tr>`,
    '</table>',
    '<h3 style="margin-top:20px">Items</h3>',
    '<table style="border-collapse:collapse;width:100%">',
    '<tr style="background:#f5f0e9"><th style="padding:8px;border:1px solid #ddd;text-align:left">Item</th><th style="padding:8px;border:1px solid #ddd;text-align:center">Qty</th><th style="padding:8px;border:1px solid #ddd;text-align:right">Price</th></tr>',
    itemsHtml,
    '</table>',
    '<table style="border-collapse:collapse;width:100%;margin-top:10px">',
    `<tr><td style="padding:8px;border:1px solid #ddd;text-align:right;width:80%"><strong>Subtotal</strong></td><td style="padding:8px;border:1px solid #ddd;text-align:right">${formatPrice(order.subtotal)}</td></tr>`,
    `<tr><td style="padding:8px;border:1px solid #ddd;text-align:right;width:80%"><strong>Delivery Fee</strong></td><td style="padding:8px;border:1px solid #ddd;text-align:right">${formatPrice(order.shippingFee || 0)}</td></tr>`,
    `<tr><td style="padding:8px;border:1px solid #ddd;text-align:right;width:80%;font-size:1.1em"><strong>Total</strong></td><td style="padding:8px;border:1px solid #ddd;text-align:right;font-size:1.1em;font-weight:bold;color:#ff7a1a">${formatPrice(order.total)}</td></tr>`,
    '</table>',
    '<h3 style="margin-top:20px">Delivery</h3>',
    `<p>${safe(order.delivery.city)} - ${safe(order.delivery.address)}<br>${safe(order.delivery.date)} at ${safe(order.delivery.slot)}</p>`,
    '<hr style="margin-top:20px;border:none;border-top:1px solid #eee">',
    '<p style="color:#666;font-size:0.85em">Questions? Contact us at <a href="mailto:info@gather-eg.com" style="color:#ff7a1a">info@gather-eg.com</a></p>',
    '</div>',
  ].join('\n')

  if (reserveCustomerEmail(order.id)) {
    const customerOk = await sendMail({
      to: order.customer.email,
      subject: `Order Confirmed — ${order.orderNumber}`,
      text: customerText,
      html: customerHtml,
    })
    if (customerOk) {
      commitCustomerEmailSent(order.id)
    } else {
      markEmailFailed(order.id, 'customer_email_failed')
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (email) {
    const session = await getCustomerSessionCookie()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (session.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const orders = getAllOrders().filter(
      (o) => o.customer.email.toLowerCase() === email.toLowerCase()
    )
    return NextResponse.json(orders)
  }

  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized
  return NextResponse.json(getAllOrders())
}

export async function POST(request: Request) {
  const rl = rateLimit(request, { windowMs: 60_000, maxRequests: 20 })
  if (!rl.ok) return rl.response

  try {
    const data = await request.json()
    const shippingFee = getShippingFeeForCity(data.delivery?.city ?? '')
    const subtotal = Number(data.subtotal) || 0

    const customer = upsertCustomerFromCheckout({
      firstName: data.customer?.firstName ?? '',
      lastName: data.customer?.lastName ?? '',
      email: data.customer?.email ?? '',
      phone: data.customer?.phone ?? '',
      city: data.delivery?.city,
      address: data.delivery?.address,
    })

    const order = createOrder({
      ...data,
      customerId: customer.id,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      delivery: {
        ...data.delivery,
        shippingFee,
      },
    })

    if (isOdooSyncEnabled()) {
      syncPartnerFromCustomer(customer.id)
      syncOrderAfterCheckout(order.id)
    }

    sendOrderNotifications(order).catch((err) => {
      console.error('[Order] notification failed:', err instanceof Error ? err.message : String(err))
    })

    const safeOrder = {
      ...order,
      syncStatus: undefined,
      syncError: undefined,
      lastSyncedAt: undefined,
    }
    return NextResponse.json(safeOrder, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id, status } = await request.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }
    const updated = updateOrderStatus(id, status)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
}

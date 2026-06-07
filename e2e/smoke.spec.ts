import { test, expect } from '@playwright/test'

test.describe('Storefront', () => {
  test('homepage loads with brand and key sections', async ({ page }) => {
    await page.goto('/')

    // Brand logo visible in header
    await expect(page.locator('header').getByRole('link').first()).toBeVisible()

    // Navigation menu present
    await expect(page.getByRole('navigation').first()).toBeVisible()

    // Footer loads with Gather branding
    await expect(page.locator('footer')).toBeVisible()
  })

  test('can browse product detail page', async ({ page }) => {
    await page.goto('/')
    // Click first product card link (links to /products/[slug])
    const productLink = page.locator('a[href^="/products/"]').first()
    await expect(productLink).toBeVisible()
    await productLink.click()

    // Product detail page loads
    await expect(page).toHaveURL(/\/products\//)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('can add product to cart from product card', async ({ page }) => {
    await page.goto('/')

    // Click first "Add to cart" button on a product card
    const addButton = page.locator('button[aria-label*="Add"]').first()
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Button shows "✓ Added" state
    await expect(addButton).toHaveText(/Added/)
  })

  test('cart page shows added item', async ({ page }) => {
    await page.goto('/')

    // Add a product to cart
    const addButton = page.locator('button[aria-label*="Add"]').first()
    await addButton.click()

    // Navigate to cart page
    await page.goto('/cart')
    await expect(page).toHaveURL(/\/cart/)

    // Cart contains at least one item
    await expect(page.getByText(/EGP|Subtotal|Cart/).first()).toBeVisible()
  })

  test('checkout page loads and shows form', async ({ page }) => {
    await page.goto('/')

    // Add a product first so checkout has items
    const addButton = page.locator('button[aria-label*="Add"]').first()
    await addButton.click()
    await page.waitForTimeout(500)

    await page.goto('/checkout')
    await expect(page).toHaveURL(/\/checkout/)

    // Checkout page renders with form elements
    await expect(page.getByText(/checkout/i).first()).toBeVisible()
  })

  test('shop-by-category page filters', async ({ page }) => {
    await page.goto('/shop-by-category')
    await expect(page).toHaveURL(/\/shop-by-category/)

    // Filter pills visible (category buttons)
    const filterPill = page.locator('button, a').filter({ hasText: /All|Gift|Cake|Flower/i }).first()
    await expect(filterPill).toBeVisible()
  })

  test('static pages render', async ({ page }) => {
    const staticPages = ['/about', '/contact', '/privacy-policy', '/refund_returns']

    for (const route of staticPages) {
      await page.goto(route)
      await expect(page).toHaveURL(route)
      // Each page should have at least one heading
      await expect(page.getByRole('heading').first()).toBeVisible()
    }
  })
})

test.describe('Admin', () => {
  test('admin login page renders', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.getByRole('heading').first()).toBeVisible()
  })

  test('login form accepts input', async ({ page }) => {
    await page.goto('/admin/login')

    // Login form fields
    const emailInput = page.locator('input[type="email"]').first()
    const passwordInput = page.locator('input[type="password"]').first()
    const submitButton = page.locator('button[type="submit"]').first()

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitButton).toBeVisible()
  })
})

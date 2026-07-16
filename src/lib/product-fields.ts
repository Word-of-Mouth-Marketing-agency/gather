export const CONTENT_FIELDS = [
  'name', 'slug', 'shortDescription', 'description',
  'nameAr', 'shortDescriptionAr', 'descriptionAr',
  'images', 'categoryIds', 'occasionIds',
  'crossSellIds', 'frequentlyBoughtTogetherIds',
  'featured', 'isActive', 'sku',
  'rating', 'reviewCount',
]

export const PRICING_FIELDS = [
  'price', 'salePrice',
  'discountStartsAt', 'discountEndsAt', 'currency',
]

export const STOCK_FIELDS = ['stock']

export const ALL_FIELDS = [...CONTENT_FIELDS, ...PRICING_FIELDS, ...STOCK_FIELDS]

export function filterContentFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of CONTENT_FIELDS) {
    if (key in data) result[key] = data[key]
  }
  return result
}

export function filterPricingFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of PRICING_FIELDS) {
    if (key in data) result[key] = data[key]
  }
  return result
}

export function filterStockFields(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of STOCK_FIELDS) {
    if (key in data) result[key] = data[key]
  }
  return result
}

import type { Product, Category, Bundle } from '@/types'
import type { Order } from './orders'
import { readJson } from './db'

// ─── Repository Interfaces ─────────────────────────────────────────────────

export interface ProductRepository {
  getAll(): Product[]
  getById(id: string): Product | undefined
  create(data: Omit<Product, 'id' | 'createdAt'>): Product
  update(id: string, data: Partial<Product>): Product | undefined
  delete(id: string): boolean
}

export interface CategoryRepository {
  getAll(): Category[]
  getById(id: string): Category | undefined
  create(data: Omit<Category, 'id'>): Category
  update(id: string, data: Partial<Category>): Category | undefined
  delete(id: string): boolean
}

export interface OrderRepository {
  getAll(): Order[]
  getById(id: string): Order | undefined
  updateStatus(id: string, status: Order['status']): Order | undefined
}

export interface BundleRepository {
  getAll(): Bundle[]
  getById(id: string): Bundle | undefined
  create(data: Omit<Bundle, 'id'>): Bundle
  update(id: string, data: Partial<Bundle>): Bundle | undefined
  delete(id: string): boolean
}

// ─── Mock JSON Implementations ────────────────────────────────────────────

import { writeJson, generateId } from './db'

const PRODUCTS_FILE = 'products.json'
const CATEGORIES_FILE = 'categories.json'
const BUNDLES_FILE = 'bundles.json'
const FBT_SUGGESTION_LIMIT = 3

function normalizeFrequentlyBoughtTogetherIds(ids?: string[], productId?: string): string[] {
  return [...new Set(ids ?? [])]
    .filter((id) => id && id !== productId)
    .slice(0, FBT_SUGGESTION_LIMIT)
}

function normalizeTopProductIds(ids?: string[]): string[] {
  return [...new Set(ids ?? [])].filter(Boolean).slice(0, 10)
}

export class JsonProductRepository implements ProductRepository {
  getAll(): Product[] {
    return readJson<Product[]>(PRODUCTS_FILE)
  }

  getById(id: string): Product | undefined {
    return this.getAll().find((p) => p.id === id)
  }

  create(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const products = this.getAll()
    const product: Product = {
      ...data,
      id: generateId('prod'),
      createdAt: new Date().toISOString(),
    }
    product.frequentlyBoughtTogetherIds = normalizeFrequentlyBoughtTogetherIds(
      data.frequentlyBoughtTogetherIds,
      product.id
    )
    products.push(product)
    writeJson(PRODUCTS_FILE, products)
    return product
  }

  update(id: string, data: Partial<Product>): Product | undefined {
    const products = this.getAll()
    const idx = products.findIndex((p) => p.id === id)
    if (idx < 0) return undefined
    products[idx] = {
      ...products[idx],
      ...data,
      frequentlyBoughtTogetherIds: data.frequentlyBoughtTogetherIds === undefined
        ? products[idx].frequentlyBoughtTogetherIds
        : normalizeFrequentlyBoughtTogetherIds(data.frequentlyBoughtTogetherIds, id),
    }
    writeJson(PRODUCTS_FILE, products)
    return products[idx]
  }

  delete(id: string): boolean {
    const products = this.getAll()
    const idx = products.findIndex((p) => p.id === id)
    if (idx < 0) return false
    products.splice(idx, 1)
    writeJson(PRODUCTS_FILE, products)
    return true
  }
}

export class JsonCategoryRepository implements CategoryRepository {
  getAll(): Category[] {
    return readJson<Category[]>(CATEGORIES_FILE)
  }

  getById(id: string): Category | undefined {
    return this.getAll().find((c) => c.id === id)
  }

  create(data: Omit<Category, 'id'>): Category {
    const items = this.getAll()
    const item: Category = {
      ...data,
      id: generateId('cat'),
      sortOrder: data.sortOrder ?? data.order ?? 0,
      isActive: data.isActive ?? true,
      topProductIds: normalizeTopProductIds(data.topProductIds),
    }
    items.push(item)
    writeJson(CATEGORIES_FILE, items)
    return item
  }

  update(id: string, data: Partial<Category>): Category | undefined {
    const items = this.getAll()
    const idx = items.findIndex((c) => c.id === id)
    if (idx < 0) return undefined
    items[idx] = {
      ...items[idx],
      ...data,
      topProductIds: data.topProductIds === undefined
        ? items[idx].topProductIds
        : normalizeTopProductIds(data.topProductIds),
    }
    writeJson(CATEGORIES_FILE, items)
    return items[idx]
  }

  delete(id: string): boolean {
    const items = this.getAll()
    const idx = items.findIndex((c) => c.id === id)
    if (idx < 0) return false
    items.splice(idx, 1)
    writeJson(CATEGORIES_FILE, items)
    return true
  }
}

export class JsonBundleRepository implements BundleRepository {
  getAll(): Bundle[] {
    return readJson<Bundle[]>(BUNDLES_FILE)
  }

  getById(id: string): Bundle | undefined {
    return this.getAll().find((b) => b.id === id)
  }

  create(data: Omit<Bundle, 'id'>): Bundle {
    const items = this.getAll()
    const now = new Date().toISOString()
    const item: Bundle = { ...data, id: generateId('bdl'), createdAt: now, updatedAt: now }
    items.push(item)
    writeJson(BUNDLES_FILE, items)
    return item
  }

  update(id: string, data: Partial<Bundle>): Bundle | undefined {
    const items = this.getAll()
    const idx = items.findIndex((b) => b.id === id)
    if (idx < 0) return undefined
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() }
    writeJson(BUNDLES_FILE, items)
    return items[idx]
  }

  delete(id: string): boolean {
    const items = this.getAll()
    const idx = items.findIndex((b) => b.id === id)
    if (idx < 0) return false
    items.splice(idx, 1)
    writeJson(BUNDLES_FILE, items)
    return true
  }
}

// ─── Odoo Adapter Scaffolds ────────────────────────────────────────────────

export class OdooProductAdapter implements ProductRepository {
  getAll(): Product[] {
    console.warn('[OdooProductAdapter] getAll not implemented – returning empty')
    return []
  }
  getById(_id: string): Product | undefined {
    return undefined
  }
  create(_data: Omit<Product, 'id' | 'createdAt'>): Product {
    throw new Error('OdooProductAdapter.create not implemented')
  }
  update(_id: string, _data: Partial<Product>): Product | undefined {
    throw new Error('OdooProductAdapter.update not implemented')
  }
  delete(_id: string): boolean {
    throw new Error('OdooProductAdapter.delete not implemented')
  }
}

export class OdooOrderAdapter implements OrderRepository {
  getAll(): Order[] {
    return []
  }
  getById(_id: string): Order | undefined {
    return undefined
  }
  updateStatus(_id: string, _status: Order['status']): Order | undefined {
    throw new Error('OdooOrderAdapter.updateStatus not implemented')
  }
}

// ─── Factory ────────────────────────────────────────────────────────────────

export function getProductRepository(): ProductRepository {
  return new JsonProductRepository()
}

export function getCategoryRepository(): CategoryRepository {
  return new JsonCategoryRepository()
}

export function getBundleRepository(): BundleRepository {
  return new JsonBundleRepository()
}

export async function getOrderRepository(): Promise<OrderRepository> {
  // Switch to OdooOrderAdapter when Odoo is ready:
  // return new OdooOrderAdapter()
  const mod = await import('./orders')
  return { getAll: mod.getAllOrders, getById: mod.getOrderById, updateStatus: mod.updateOrderStatus }
}

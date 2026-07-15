import type { Product, Category, Bundle } from '@/types'
import type { Order } from './orders'
import { readJson } from './db'

// ─── Repository Interfaces ─────────────────────────────────────────────────

export interface ProductRepository {
  getAll(includeArchived?: boolean): Product[]
  getById(id: string, includeArchived?: boolean): Product | undefined
  create(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product>
  update(id: string, data: Partial<Product>): Promise<Product | undefined>
  delete(id: string): Promise<boolean>
}

export interface CategoryRepository {
  getAll(): Category[]
  getById(id: string): Category | undefined
  create(data: Omit<Category, 'id'>): Promise<Category>
  update(id: string, data: Partial<Category>): Promise<Category | undefined>
  delete(id: string): Promise<boolean>
}

export interface OrderRepository {
  getAll(): Order[]
  getById(id: string): Order | undefined
  updateStatus(id: string, status: Order['status']): Promise<Order | undefined>
}

export interface BundleRepository {
  getAll(): Bundle[]
  getById(id: string): Bundle | undefined
  create(data: Omit<Bundle, 'id'>): Promise<Bundle>
  update(id: string, data: Partial<Bundle>): Promise<Bundle | undefined>
  delete(id: string): Promise<boolean>
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
  getAll(includeArchived = false): Product[] {
    const products = readJson<Product[]>(PRODUCTS_FILE)
    if (includeArchived) return products
    return products.filter((p) => p.isActive !== false)
  }

  getById(id: string, includeArchived = false): Product | undefined {
    return this.getAll(includeArchived).find((p) => p.id === id)
  }

  async create(data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const products = this.getAll(true)
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
    await writeJson(PRODUCTS_FILE, products)
    return product
  }

  async update(id: string, data: Partial<Product>): Promise<Product | undefined> {
    const products = this.getAll(true)
    const idx = products.findIndex((p) => p.id === id)
    if (idx < 0) return undefined
    products[idx] = {
      ...products[idx],
      ...data,
      frequentlyBoughtTogetherIds: data.frequentlyBoughtTogetherIds === undefined
        ? products[idx].frequentlyBoughtTogetherIds
        : normalizeFrequentlyBoughtTogetherIds(data.frequentlyBoughtTogetherIds, id),
    }
    await writeJson(PRODUCTS_FILE, products)
    return products[idx]
  }

  async delete(id: string): Promise<boolean> {
    const products = this.getAll(true)
    const idx = products.findIndex((p) => p.id === id)
    if (idx < 0) return false
    products.splice(idx, 1)
    await writeJson(PRODUCTS_FILE, products)
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

  async create(data: Omit<Category, 'id'>): Promise<Category> {
    const items = this.getAll()
    const item: Category = {
      ...data,
      id: generateId('cat'),
      sortOrder: data.sortOrder ?? data.order ?? 0,
      isActive: data.isActive ?? true,
      topProductIds: normalizeTopProductIds(data.topProductIds),
    }
    items.push(item)
    await writeJson(CATEGORIES_FILE, items)
    return item
  }

  async update(id: string, data: Partial<Category>): Promise<Category | undefined> {
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
    await writeJson(CATEGORIES_FILE, items)
    return items[idx]
  }

  async delete(id: string): Promise<boolean> {
    const items = this.getAll()
    const idx = items.findIndex((c) => c.id === id)
    if (idx < 0) return false
    items.splice(idx, 1)
    await writeJson(CATEGORIES_FILE, items)
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

  async create(data: Omit<Bundle, 'id'>): Promise<Bundle> {
    const items = this.getAll()
    const now = new Date().toISOString()
    const item: Bundle = { ...data, id: generateId('bdl'), createdAt: now, updatedAt: now }
    items.push(item)
    await writeJson(BUNDLES_FILE, items)
    return item
  }

  async update(id: string, data: Partial<Bundle>): Promise<Bundle | undefined> {
    const items = this.getAll()
    const idx = items.findIndex((b) => b.id === id)
    if (idx < 0) return undefined
    items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() }
    await writeJson(BUNDLES_FILE, items)
    return items[idx]
  }

  async delete(id: string): Promise<boolean> {
    const items = this.getAll()
    const idx = items.findIndex((b) => b.id === id)
    if (idx < 0) return false
    items.splice(idx, 1)
    await writeJson(BUNDLES_FILE, items)
    return true
  }
}

// ─── Odoo Adapter Scaffolds ────────────────────────────────────────────────

export class OdooProductAdapter implements ProductRepository {
  getAll(_includeArchived = false): Product[] {
    console.warn('[OdooProductAdapter] getAll not implemented – returning empty')
    return []
  }
  getById(_id: string, _includeArchived = false): Product | undefined {
    return undefined
  }
  async create(_data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    throw new Error('OdooProductAdapter.create not implemented')
  }
  async update(_id: string, _data: Partial<Product>): Promise<Product | undefined> {
    throw new Error('OdooProductAdapter.update not implemented')
  }
  async delete(_id: string): Promise<boolean> {
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
  async updateStatus(_id: string, _status: Order['status']): Promise<Order | undefined> {
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

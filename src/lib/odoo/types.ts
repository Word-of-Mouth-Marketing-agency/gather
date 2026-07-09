/**
 * Odoo ERP integration interface stubs — Phase 1
 *
 * These types define the contract for future Odoo integration.
 * Phase 1 uses mock data only; these interfaces ensure the codebase
 * is structured for a drop-in Odoo adapter in Phase 2.
 */

import type { OdooProduct, OdooOrder, OdooSyncResult } from '@/types'

export interface OdooOrmResult {
  id: number
  [key: string]: unknown
}

export interface OdooConfig {
  url: string
  db: string
  username: string
  apiKey: string
}

export interface OdooAdapter {
  // Product sync
  fetchProducts(): Promise<OdooProduct[]>
  fetchProductById(odooId: number): Promise<OdooProduct | null>
  syncProductToLocal(odooProduct: OdooProduct): Promise<void>

  // Order sync
  createOrder(order: OdooOrder): Promise<{ odooOrderId: number }>
  fetchOrderStatus(odooOrderId: number): Promise<string>

  // Inventory
  checkStock(productId: number): Promise<number>

  // Sync status
  getLastSyncTime(): Promise<string>
  runFullSync(): Promise<OdooSyncResult>
}

// Mock implementation placeholder — replace with real Odoo JSONRPC adapter in Phase 2
export class MockOdooAdapter implements OdooAdapter {
  async fetchProducts(): Promise<OdooProduct[]> {
    return []
  }

  async fetchProductById(_odooId: number): Promise<OdooProduct | null> {
    return null
  }

  async syncProductToLocal(_odooProduct: OdooProduct): Promise<void> {}

  async createOrder(_order: OdooOrder): Promise<{ odooOrderId: number }> {
    return { odooOrderId: -1 }
  }

  async fetchOrderStatus(_odooOrderId: number): Promise<string> {
    return 'draft'
  }

  async checkStock(_productId: number): Promise<number> {
    return 0
  }

  async getLastSyncTime(): Promise<string> {
    return new Date().toISOString()
  }

  async runFullSync(): Promise<OdooSyncResult> {
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      errors: [],
    }
  }
}

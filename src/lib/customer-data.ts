import { readJson, writeJson, generateId } from './db'
import type { Customer, Address } from '@/types'

const CUSTOMERS_FILE = 'customers.json'

function getCustomers(): Customer[] {
  try {
    return readJson<Customer[]>(CUSTOMERS_FILE)
  } catch {
    return []
  }
}

function saveCustomers(data: Customer[]): void {
  writeJson(CUSTOMERS_FILE, data)
}

export function findCustomerByEmail(email: string): Customer | undefined {
  return getCustomers().find((c) => c.email.toLowerCase() === email.toLowerCase())
}

export function findCustomerById(id: string): Customer | undefined {
  return getCustomers().find((c) => c.id === id)
}

export function createCustomer(data: { name: string; email: string; phone: string; password: string }): Customer {
  const customers = getCustomers()
  const customer: Customer = {
    id: generateId('cust'),
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    password: data.password,
    addresses: [],
    createdAt: new Date().toISOString(),
  }
  customers.push(customer)
  saveCustomers(customers)
  return customer
}

export function updateCustomer(id: string, data: Partial<Pick<Customer, 'name' | 'email' | 'phone'>>): Customer | null {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return null
  customers[idx] = { ...customers[idx], ...data }
  saveCustomers(customers)
  return customers[idx]
}

export function getCustomerAddresses(id: string): Address[] {
  const customer = findCustomerById(id)
  return customer?.addresses ?? []
}

export function addCustomerAddress(id: string, data: Omit<Address, 'id'>): Address | null {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const address: Address = { ...data, id: generateId('addr') }
  if (address.isDefault) {
    customers[idx].addresses.forEach((a) => { a.isDefault = false })
  }
  customers[idx].addresses.push(address)
  saveCustomers(customers)
  return address
}

export function updateCustomerAddress(customerId: string, addressId: string, data: Partial<Omit<Address, 'id'>>): Address | null {
  const customers = getCustomers()
  const cIdx = customers.findIndex((c) => c.id === customerId)
  if (cIdx < 0) return null
  const aIdx = customers[cIdx].addresses.findIndex((a) => a.id === addressId)
  if (aIdx < 0) return null
  if (data.isDefault) {
    customers[cIdx].addresses.forEach((a) => { a.isDefault = false })
  }
  customers[cIdx].addresses[aIdx] = { ...customers[cIdx].addresses[aIdx], ...data }
  saveCustomers(customers)
  return customers[cIdx].addresses[aIdx]
}

export function deleteCustomerAddress(customerId: string, addressId: string): boolean {
  const customers = getCustomers()
  const cIdx = customers.findIndex((c) => c.id === customerId)
  if (cIdx < 0) return false
  const len = customers[cIdx].addresses.length
  customers[cIdx].addresses = customers[cIdx].addresses.filter((a) => a.id !== addressId)
  if (customers[cIdx].addresses.length === len) return false
  saveCustomers(customers)
  return true
}

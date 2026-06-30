import { readJson, writeJson, generateId } from './db'
import type { Customer, Address } from '@/types'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const CUSTOMERS_FILE = 'customers.json'
const PASSWORD_PREFIX = 'scrypt'
const PASSWORD_KEY_LENGTH = 64

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('base64url')
  return `${PASSWORD_PREFIX}$${salt}$${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [prefix, salt, hash] = stored.split('$')
  if (prefix !== PASSWORD_PREFIX || !salt || !hash) {
    return password === stored
  }

  try {
    const expected = Buffer.from(hash, 'base64url')
    const actual = scryptSync(password, salt, expected.length)
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function isLegacyPlaintextPassword(stored: string): boolean {
  return !stored.startsWith(`${PASSWORD_PREFIX}$`)
}

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

function isCustomerActive(customer: Customer): boolean {
  return customer.isActive !== false && customer.status !== 'disabled'
}

export type AdminCustomer = Omit<Customer, 'password'>

function toAdminCustomer(customer: Customer): AdminCustomer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safeCustomer } = customer
  return {
    ...safeCustomer,
    isActive: isCustomerActive(customer),
    status: isCustomerActive(customer) ? 'active' : 'disabled',
  }
}

export function getAllCustomers(): Customer[] {
  return getCustomers()
}

export function getAdminCustomers(): AdminCustomer[] {
  return getCustomers().map(toAdminCustomer)
}

export function getAdminCustomerById(id: string): AdminCustomer | undefined {
  const customer = findCustomerById(id)
  return customer ? toAdminCustomer(customer) : undefined
}

export function findCustomerByEmail(email: string): Customer | undefined {
  return getCustomers().find((c) => c.email.toLowerCase() === email.toLowerCase())
}

export function findCustomerById(id: string): Customer | undefined {
  return getCustomers().find((c) => c.id === id)
}

export function createCustomer(data: {
  name: string
  email: string
  phone: string
  password: string
  acceptedDataPolicy?: boolean
  acceptedTermsAndConditions?: boolean
  acceptedCustomerPoliciesAt?: string
}): Customer {
  const customers = getCustomers()
  const customer: Customer = {
    id: generateId('cust'),
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone,
    password: hashPassword(data.password),
    addresses: [],
    isActive: true,
    status: 'active',
    acceptedDataPolicy: data.acceptedDataPolicy,
    acceptedTermsAndConditions: data.acceptedTermsAndConditions,
    acceptedCustomerPoliciesAt: data.acceptedCustomerPoliciesAt,
    createdAt: new Date().toISOString(),
  }
  customers.push(customer)
  saveCustomers(customers)
  return customer
}

export function verifyCustomerPassword(email: string, password: string): Customer | null {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.email.toLowerCase() === email.toLowerCase())
  if (idx < 0) return null
  const customer = customers[idx]
  if (!verifyPassword(password, customer.password)) return null

  if (isLegacyPlaintextPassword(customer.password)) {
    customers[idx] = { ...customer, password: hashPassword(password) }
    saveCustomers(customers)
    return customers[idx]
  }

  return customer
}

export function updateCustomer(id: string, data: Partial<Pick<Customer, 'name' | 'email' | 'phone' | 'isActive' | 'status'>>): Customer | null {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const updates: Partial<Pick<Customer, 'name' | 'email' | 'phone'>> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.email !== undefined) updates.email = data.email.toLowerCase()
  if (data.phone !== undefined) updates.phone = data.phone
  const nextStatus = data.status ?? (data.isActive === false ? 'disabled' : data.isActive === true ? 'active' : customers[idx].status)
  customers[idx] = {
    ...customers[idx],
    ...updates,
    isActive: nextStatus === 'disabled' ? false : true,
    status: nextStatus === 'disabled' ? 'disabled' : 'active',
  }
  saveCustomers(customers)
  return customers[idx]
}

export function deleteCustomer(id: string): boolean {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return false
  customers.splice(idx, 1)
  saveCustomers(customers)
  return true
}

export function customerIsActive(customer: Customer): boolean {
  return isCustomerActive(customer)
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

import { readJson, writeJson, generateId, withLock } from './db'
import type { Customer, Address } from '@/types'
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto'

const CUSTOMERS_FILE = 'customers.json'
const PASSWORD_PREFIX = 'scrypt'
const PASSWORD_KEY_LENGTH = 64
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000

const TOKEN_PREFIX = 'rt1'
function hashResetToken(token: string): string {
  const hash = createHash('sha256').update(token).digest('base64url')
  return `${TOKEN_PREFIX}$${hash}`
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

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

async function saveCustomers(data: Customer[]): Promise<void> {
  await writeJson(CUSTOMERS_FILE, data)
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

export async function createCustomer(data: {
  name: string
  email: string
  phone: string
  password: string
  acceptedDataPolicy?: boolean
  acceptedTermsAndConditions?: boolean
  acceptedCustomerPoliciesAt?: string
}): Promise<Customer> {
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
  await saveCustomers(customers)
  return customer
}

export async function verifyCustomerPassword(email: string, password: string): Promise<Customer | null> {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.email.toLowerCase() === email.toLowerCase())
  if (idx < 0) return null
  const customer = customers[idx]
  if (!verifyPassword(password, customer.password)) return null

  if (isLegacyPlaintextPassword(customer.password)) {
    customers[idx] = { ...customer, password: hashPassword(password) }
    await saveCustomers(customers)
    return customers[idx]
  }

  return customer
}

export async function upsertCustomerFromCheckout(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  city?: string
  address?: string
}): Promise<Customer> {
  const customers = getCustomers()
  const existingIdx = customers.findIndex((c) => c.email.toLowerCase() === data.email.toLowerCase())

  if (existingIdx >= 0) {
    const customer = customers[existingIdx]
    if (!customer.name && `${data.firstName} ${data.lastName}`.trim()) {
      customer.name = `${data.firstName} ${data.lastName}`.trim()
    }
    if (!customer.phone && data.phone) {
      customer.phone = data.phone
    }
    if (data.city && data.address) {
      const existingAddr = customer.addresses.find((a) => a.city === data.city && a.street === data.address)
      if (!existingAddr) {
        const newAddr: Address = {
          id: generateId('addr'),
          label: 'Checkout address',
          city: data.city,
          street: data.address,
          phone: data.phone,
          isDefault: customer.addresses.length === 0,
        }
        customer.addresses.push(newAddr)
      }
    }
    await saveCustomers(customers)
    return customer
  }

  const firstName = data.firstName || ''
  const lastName = data.lastName || ''
  const name = `${firstName} ${lastName}`.trim()
  const guestPassword = hashPassword(`${data.email}:${Date.now()}:${Math.random()}`)
  const customer: Customer = {
    id: generateId('cust'),
    name: name || data.email.split('@')[0],
    email: data.email.toLowerCase(),
    phone: data.phone,
    password: guestPassword,
    addresses: [],
    isActive: true,
    status: 'active',
    needsPasswordSetup: true,
    createdAt: new Date().toISOString(),
  }
  if (data.city && data.address) {
    customer.addresses.push({
      id: generateId('addr'),
      label: 'Checkout address',
      city: data.city,
      street: data.address,
      phone: data.phone,
      isDefault: true,
    })
  }
  customers.push(customer)
  await saveCustomers(customers)
  return customer
}

export async function updateCustomer(id: string, data: Partial<Pick<Customer, 'name' | 'email' | 'phone' | 'isActive' | 'status'>>): Promise<Customer | null> {
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
  await saveCustomers(customers)
  return customers[idx]
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return false
  customers.splice(idx, 1)
  await saveCustomers(customers)
  return true
}

export function customerIsActive(customer: Customer): boolean {
  return isCustomerActive(customer)
}

export function getCustomerAddresses(id: string): Address[] {
  const customer = findCustomerById(id)
  return customer?.addresses ?? []
}

export async function addCustomerAddress(id: string, data: Omit<Address, 'id'>): Promise<Address | null> {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return null
  const address: Address = { ...data, id: generateId('addr') }
  if (address.isDefault) {
    customers[idx].addresses.forEach((a) => { a.isDefault = false })
  }
  customers[idx].addresses.push(address)
  await saveCustomers(customers)
  return address
}

export async function updateCustomerAddress(customerId: string, addressId: string, data: Partial<Omit<Address, 'id'>>): Promise<Address | null> {
  const customers = getCustomers()
  const cIdx = customers.findIndex((c) => c.id === customerId)
  if (cIdx < 0) return null
  const aIdx = customers[cIdx].addresses.findIndex((a) => a.id === addressId)
  if (aIdx < 0) return null
  if (data.isDefault) {
    customers[cIdx].addresses.forEach((a) => { a.isDefault = false })
  }
  customers[cIdx].addresses[aIdx] = { ...customers[cIdx].addresses[aIdx], ...data }
  await saveCustomers(customers)
  return customers[cIdx].addresses[aIdx]
}

export async function deleteCustomerAddress(customerId: string, addressId: string): Promise<boolean> {
  const customers = getCustomers()
  const cIdx = customers.findIndex((c) => c.id === customerId)
  if (cIdx < 0) return false
  const len = customers[cIdx].addresses.length
  customers[cIdx].addresses = customers[cIdx].addresses.filter((a) => a.id !== addressId)
  if (customers[cIdx].addresses.length === len) return false
  await saveCustomers(customers)
  return true
}

export async function generatePasswordResetToken(email: string): Promise<string | null> {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.email.toLowerCase() === email.toLowerCase())
  if (idx < 0) return null

  const rawToken = randomBytes(32).toString('base64url')
  const hashedToken = hashResetToken(rawToken)
  const customer = customers[idx]

  customer.passwordResetToken = hashedToken
  customer.passwordResetExpiry = Date.now() + RESET_TOKEN_EXPIRY_MS
  await saveCustomers(customers)

  return rawToken
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<boolean> {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => {
    if (!c.passwordResetToken || !c.passwordResetExpiry) return false
    if (c.passwordResetExpiry <= Date.now()) return false
    return c.passwordResetToken === hashResetToken(rawToken)
  })
  if (idx < 0) return false

  customers[idx].password = hashPassword(newPassword)
  customers[idx].passwordResetToken = undefined
  customers[idx].passwordResetExpiry = undefined
  customers[idx].needsPasswordSetup = false
  await saveCustomers(customers)
  return true
}

export async function setCustomerPassword(id: string, newPassword: string): Promise<boolean> {
  const customers = getCustomers()
  const idx = customers.findIndex((c) => c.id === id)
  if (idx < 0) return false
  customers[idx].password = hashPassword(newPassword)
  customers[idx].needsPasswordSetup = false
  await saveCustomers(customers)
  return true
}

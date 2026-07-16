import { randomBytes, scryptSync, timingSafeEqual as nodeTimingSafeEqual } from 'crypto'
import { readJson, writeJson, writeJsonUnlocked, generateId, withLock } from './db'
import type { Role } from './permissions'

const ADMINS_FILE = 'admin-users.json'
const PASSWORD_PREFIX = 'scrypt'
const PASSWORD_KEY_LENGTH = 64

export interface AdminUser {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  lastLoginAt?: string
  passwordChangedAt?: string
}

export type AdminUserSafe = Omit<AdminUser, 'passwordHash'>

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url')
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('base64url')
  return `${PASSWORD_PREFIX}$${salt}$${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [prefix, salt, hash] = stored.split('$')
  if (prefix !== PASSWORD_PREFIX || !salt || !hash) {
    return false
  }
  try {
    const expected = Buffer.from(hash, 'base64url')
    const actual = scryptSync(password, salt, expected.length)
    return expected.length === actual.length && nodeTimingSafeEqual(expected, actual)
  } catch {
    return false
  }
}

function now(): string {
  return new Date().toISOString()
}

function getAdmins(): AdminUser[] {
  try {
    return readJson<AdminUser[]>(ADMINS_FILE)
  } catch {
    return []
  }
}

// Must only be called from inside a withLock(ADMINS_FILE) callback
function saveAdminsLocked(data: AdminUser[]): void {
  writeJsonUnlocked(ADMINS_FILE, data)
}

async function saveAdmins(data: AdminUser[]): Promise<void> {
  await writeJson(ADMINS_FILE, data)
}

function toSafe(admin: AdminUser): AdminUserSafe {
  const { passwordHash, ...safe } = admin
  return safe
}

export function getAllAdmins(): AdminUserSafe[] {
  return getAdmins().map(toSafe)
}

export function getAdminById(id: string): AdminUser | undefined {
  return getAdmins().find((a) => a.id === id)
}

export function getSafeAdminById(id: string): AdminUserSafe | undefined {
  const admin = getAdminById(id)
  return admin ? toSafe(admin) : undefined
}

export function getAdminByEmail(email: string): AdminUser | undefined {
  const normalized = email.toLowerCase().trim()
  return getAdmins().find((a) => a.email === normalized)
}

export async function createAdmin(data: {
  name: string
  email: string
  password: string
  role: Role
  createdBy: string
}): Promise<AdminUserSafe> {
  const normalized = data.email.toLowerCase().trim()
  const existing = getAdminByEmail(normalized)
  if (existing) {
    throw new Error('An admin with this email already exists')
  }

  return withLock(ADMINS_FILE, async () => {
    const admins = getAdmins()
    const dup = admins.find((a) => a.email === normalized)
    if (dup) {
      throw new Error('An admin with this email already exists')
    }

    const admin: AdminUser = {
      id: generateId('admin'),
      name: data.name,
      email: normalized,
      passwordHash: hashPassword(data.password),
      role: data.role,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      createdBy: data.createdBy,
    }
    admins.push(admin)
    saveAdminsLocked(admins)
    return toSafe(admin)
  })
}

export async function updateAdmin(
  id: string,
  data: {
    name?: string
    email?: string
    role?: Role
    isActive?: boolean
  },
  performedBy: string,
): Promise<AdminUserSafe> {
  return withLock(ADMINS_FILE, async () => {
    const admins = getAdmins()
    const idx = admins.findIndex((a) => a.id === id)
    if (idx < 0) throw new Error('Admin not found')
    const admin = admins[idx]

    if (data.email !== undefined && data.email.toLowerCase().trim() !== admin.email) {
      const normalized = data.email.toLowerCase().trim()
      const dup = admins.find((a) => a.email === normalized && a.id !== id)
      if (dup) throw new Error('An admin with this email already exists')
      admin.email = normalized
    }

    if (data.name !== undefined) admin.name = data.name
    if (data.role !== undefined) admin.role = data.role
    if (data.isActive !== undefined) admin.isActive = data.isActive
    admin.updatedAt = now()

    saveAdminsLocked(admins)
    return toSafe(admin)
  })
}

export async function deleteAdmin(id: string, performedBy: string): Promise<void> {
  return withLock(ADMINS_FILE, async () => {
    const admins = getAdmins()
    const idx = admins.findIndex((a) => a.id === id)
    if (idx < 0) throw new Error('Admin not found')

    const activeSuperAdmins = admins.filter(
      (a) => a.role === 'super_admin' && a.isActive && a.id !== id,
    )
    const targetIsSuperAdmin = admins[idx].role === 'super_admin' && admins[idx].isActive
    if (targetIsSuperAdmin && activeSuperAdmins.length === 0) {
      throw new Error('Cannot delete the last active super admin')
    }

    admins.splice(idx, 1)
    saveAdminsLocked(admins)
  })
}

export async function verifyAdminLogin(email: string, password: string): Promise<AdminUserSafe | null> {
  const normalized = email.toLowerCase().trim()
  const admin = getAdminByEmail(normalized)
  if (!admin) return null
  if (!admin.isActive) return null
  if (!verifyPassword(password, admin.passwordHash)) return null

  const admins = getAdmins()
  const idx = admins.findIndex((a) => a.id === admin.id)
  if (idx >= 0) {
    admins[idx].lastLoginAt = now()
    await saveAdmins(admins)
  }

  return toSafe(admin)
}

export async function changePassword(id: string, newPassword: string): Promise<void> {
  return withLock(ADMINS_FILE, async () => {
    const admins = getAdmins()
    const idx = admins.findIndex((a) => a.id === id)
    if (idx < 0) throw new Error('Admin not found')
    admins[idx].passwordHash = hashPassword(newPassword)
    admins[idx].passwordChangedAt = now()
    admins[idx].updatedAt = now()
    saveAdminsLocked(admins)
  })
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  return changePassword(id, newPassword)
}

export function countActiveSuperAdmins(): number {
  return getAdmins().filter((a) => a.role === 'super_admin' && a.isActive).length
}

export async function bootstrapInitialAdmin(email: string, password: string, name: string): Promise<AdminUserSafe> {
  const normalized = email.toLowerCase().trim()
  const existing = getAdminByEmail(normalized)
  if (existing) {
    if (!existing.isActive) {
      return withLock(ADMINS_FILE, async () => {
        const admins = getAdmins()
        const idx = admins.findIndex((a) => a.id === existing.id)
        if (idx >= 0) {
          admins[idx].isActive = true
          admins[idx].passwordHash = hashPassword(password)
          admins[idx].updatedAt = now()
          saveAdminsLocked(admins)
        }
        return toSafe(admins[idx])
      })
    }
    return toSafe(existing)
  }

  return withLock(ADMINS_FILE, async () => {
    const admins = getAdmins()
    const dup = admins.find((a) => a.email === normalized)
    if (dup) return toSafe(dup)

    const admin: AdminUser = {
      id: generateId('admin'),
      name,
      email: normalized,
      passwordHash: hashPassword(password),
      role: 'super_admin',
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
      createdBy: 'system',
    }
    admins.push(admin)
    saveAdminsLocked(admins)
    return toSafe(admin)
  })
}

export function isAdminUsersEmpty(): boolean {
  return getAdmins().length === 0
}

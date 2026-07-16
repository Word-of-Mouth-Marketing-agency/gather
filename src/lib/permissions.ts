export type Role = 'super_admin' | 'marketing_admin' | 'finance_admin'

export type Permission =
  | 'admin_users.manage'

  | 'products.content.read'
  | 'products.content.write'
  | 'products.pricing.read'
  | 'products.pricing.write'
  | 'products.stock.read'
  | 'products.stock.write'

  | 'pages.read'
  | 'pages.write'

  | 'categories.read'
  | 'categories.write'

  | 'ratings.read'
  | 'ratings.write'

  | 'moments.read'
  | 'moments.write'

  | 'bundles.read'
  | 'bundles.write'

  | 'shipping.read'
  | 'shipping.write'

  | 'coupons.read'
  | 'coupons.write'

  | 'orders.read'
  | 'orders.write'

  | 'customers.read'
  | 'customers.write'

  | 'odoo.read'
  | 'odoo.manage'

  | 'settings.manage'

  | 'media.upload'
  | 'audit.view'

type RolePermissionMap = Record<Role, Permission[]>

const rolePermissions: RolePermissionMap = {
  super_admin: [
    'admin_users.manage',
    'products.content.read',
    'products.content.write',
    'products.pricing.read',
    'products.pricing.write',
    'products.stock.read',
    'products.stock.write',
    'pages.read',
    'pages.write',
    'categories.read',
    'categories.write',
    'ratings.read',
    'ratings.write',
    'moments.read',
    'moments.write',
    'bundles.read',
    'bundles.write',
    'shipping.read',
    'shipping.write',
    'coupons.read',
    'coupons.write',
    'orders.read',
    'orders.write',
    'customers.read',
    'customers.write',
    'odoo.read',
    'odoo.manage',
    'settings.manage',
    'media.upload',
    'audit.view',
  ],
  marketing_admin: [
    'products.content.read',
    'products.content.write',
    'pages.read',
    'pages.write',
    'categories.read',
    'categories.write',
    'ratings.read',
    'ratings.write',
    'moments.read',
    'moments.write',
    'media.upload',
  ],
  finance_admin: [
    'products.pricing.read',
    'products.pricing.write',
    'products.stock.read',
    'products.stock.write',
    'bundles.read',
    'bundles.write',
    'shipping.read',
    'shipping.write',
    'coupons.read',
    'coupons.write',
    'orders.read',
    'orders.write',
  ],
}

export function getPermissionsForRole(role: Role): Permission[] {
  return rolePermissions[role] ?? []
}

export function hasPermission(
  userRole: Role | undefined | null,
  requiredPermission: Permission,
): boolean {
  if (!userRole) return false
  return getPermissionsForRole(userRole).includes(requiredPermission)
}

export function hasAnyPermission(
  userRole: Role | undefined | null,
  requiredPermissions: Permission[],
): boolean {
  if (!userRole) return false
  const userPerms = getPermissionsForRole(userRole)
  return requiredPermissions.some((p) => userPerms.includes(p))
}

export function hasAllPermissions(
  userRole: Role | undefined | null,
  requiredPermissions: Permission[],
): boolean {
  if (!userRole) return false
  const userPerms = getPermissionsForRole(userRole)
  return requiredPermissions.every((p) => userPerms.includes(p))
}

export function getRoleLabel(role: Role, lang: 'en' | 'ar' = 'en'): string {
  const labels: Record<Role, { en: string; ar: string }> = {
    super_admin: { en: 'Super Admin', ar: 'مدير النظام' },
    marketing_admin: { en: 'Marketing Admin', ar: 'مسؤول التسويق' },
    finance_admin: { en: 'Finance Admin', ar: 'المسؤول المالي' },
  }
  return labels[role]?.[lang] ?? role
}

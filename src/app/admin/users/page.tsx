'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdminUserSafe } from '@/lib/admin-users'
import { getRoleLabel } from '@/lib/permissions'

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUserSafe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    try {
      const me = await fetch('/api/auth/me')
      if (!me.ok) { router.push('/admin/login'); return }
      const res = await fetch('/api/admin/users')
      if (res.ok) setAdmins(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }, [router])

  useEffect(() => { startTransition(() => { load() }) }, [load])

  const filtered = admins.filter((a) => {
    if (search) {
      const q = search.toLowerCase()
      if (!a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false
    }
    if (filterRole !== 'all' && a.role !== filterRole) return false
    if (filterStatus === 'active' && !a.isActive) return false
    if (filterStatus === 'inactive' && a.isActive) return false
    return true
  })

  async function handleToggleActive(admin: AdminUserSafe) {
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !admin.isActive }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update')
        return
      }
      await load()
    } catch {
      setError('Network error')
    }
  }

  async function handleDelete(id: string) {
    if (deleting !== id) {
      setDeleting(id)
      setTimeout(() => setDeleting(null), 3000)
      return
    }
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete')
        setDeleting(null)
        return
      }
      setDeleting(null)
      await load()
    } catch {
      setError('Network error')
      setDeleting(null)
    }
  }

  const inputCls = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20'

  return (
    <div className="space-y-6" dir="ltr">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{admins.length} admin accounts</p>
        </div>
        <Link href="/admin/users/new" className="gather-btn-primary text-sm py-2.5 px-5 shadow-md inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Admin
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputCls} max-w-xs`}
        />
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={`${inputCls} max-w-[180px]`}>
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="marketing_admin">Marketing Admin</option>
          <option value="finance_admin">Finance Admin</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputCls} max-w-[160px]`}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden md:table-cell">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide hidden lg:table-cell">Last Login</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{admin.name}</p>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell text-gray-500">{admin.email}</td>
                  <td className="px-5 py-3">
                    <RoleBadge role={admin.role} />
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                      admin.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/admin/users/${admin.id}/edit`} className="text-xs text-[#ff7a1a] hover:underline font-semibold">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleToggleActive(admin)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className={`text-xs font-semibold transition-colors ${
                          deleting === admin.id ? 'text-white bg-red-500 px-2 py-0.5 rounded' : 'text-red-400 hover:text-red-500'
                        }`}
                      >
                        {deleting === admin.id ? 'Confirm?' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              {search || filterRole !== 'all' || filterStatus !== 'all'
                ? 'No admin users match your filters.'
                : 'No admin users yet.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: 'bg-purple-50 text-purple-700',
    marketing_admin: 'bg-blue-50 text-blue-700',
    finance_admin: 'bg-green-50 text-green-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[role] || 'bg-gray-100 text-gray-600'}`}>
      {getRoleLabel(role as 'super_admin' | 'marketing_admin' | 'finance_admin')}
    </span>
  )
}

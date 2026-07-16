'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { AdminUserSafe } from '@/lib/admin-users'
import { getRoleLabel } from '@/lib/permissions'

export default function EditAdminUserPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [admin, setAdmin] = useState<AdminUserSafe | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', role: 'marketing_admin', isActive: true })
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/users/${id}`)
        if (res.ok) {
          const data: AdminUserSafe = await res.json()
          setAdmin(data)
          setForm({ name: data.name, email: data.email, role: data.role, isActive: data.isActive })
        }
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [id])

  function setField(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = { ...form }
      if (newPassword) {
        if (newPassword.length < 8) {
          setError('Password must be at least 8 characters')
          setSaving(false)
          return
        }
        body.password = newPassword
      }
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update')
        return
      }
      router.push('/admin/users')
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>
  if (!admin) return <p className="text-sm text-red-500">Admin not found.</p>

  const inputCls = 'w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20'

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Admin Users
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">Edit: {admin.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">{error}</div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Role</label>
          <select
            value={form.role}
            onChange={(e) => setField('role', e.target.value)}
            className={inputCls}
          >
            <option value="super_admin">{getRoleLabel('super_admin')}</option>
            <option value="marketing_admin">{getRoleLabel('marketing_admin')}</option>
            <option value="finance_admin">{getRoleLabel('finance_admin')}</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#ff7a1a] focus:ring-[#ff7a1a]"
            />
            <span className="text-sm font-semibold text-gray-700">Active</span>
          </label>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">New Password (leave blank to keep current)</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputCls}
            placeholder="Min 8 characters"
            minLength={8}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="gather-btn-primary text-sm py-2.5 px-6 shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            href="/admin/users"
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

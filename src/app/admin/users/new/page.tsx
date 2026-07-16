'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getRoleLabel } from '@/lib/permissions'

export default function NewAdminUserPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'marketing_admin' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create admin')
        return
      }
      router.push('/admin/users')
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20'

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Admin Users
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">New Admin User</h1>
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
            placeholder="John Doe"
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
            placeholder="admin@gather-eg.com"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Password</label>
          <input
            required
            type="password"
            value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            className={inputCls}
            placeholder="Min 8 characters"
            minLength={8}
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="gather-btn-primary text-sm py-2.5 px-6 shadow-md disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Admin'}
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

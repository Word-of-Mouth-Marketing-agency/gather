'use client'

import { useState, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AuditEntry } from '@/lib/audit-log'

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const router = useRouter()

  useEffect(() => {
    startTransition(async () => {
      try {
        const me = await fetch('/api/auth/me')
        if (!me.ok) { router.push('/admin/login'); return }
        const res = await fetch('/api/admin/audit-log')
        if (res.ok) setEntries(await res.json())
      } catch { /* ignore */ }
      setLoading(false)
    })
  }, [router])

  const filtered = filter
    ? entries.filter((e) =>
        e.action.toLowerCase().includes(filter.toLowerCase()) ||
        e.adminEmail.toLowerCase().includes(filter.toLowerCase()) ||
        e.targetType.toLowerCase().includes(filter.toLowerCase())
      )
    : entries

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-400 mt-0.5">Track admin actions and changes</p>
      </div>

      <input
        type="search"
        placeholder="Filter by action, email, or target..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full max-w-sm rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {filter ? 'No entries match your filter.' : 'No audit log entries yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Admin</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Target</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800 text-xs">{entry.adminEmail}</p>
                      <p className="text-[10px] text-gray-400">{entry.adminRole}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-700">
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {entry.targetType}
                      {entry.targetId && <span className="text-gray-400 ml-1">/{entry.targetId.slice(0, 20)}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                      {entry.metadata ? JSON.stringify(entry.metadata).slice(0, 100) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, startTransition } from 'react'
import type { MomentSubmission } from '@/types'

export default function AdminMomentsPage() {
  const [items, setItems] = useState<MomentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/moments')
      if (res.ok) setItems(await res.json())
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { startTransition(() => { load() }) }, [])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setUpdating(id)
    try {
      await fetch(`/api/moments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await load()
    } catch { /* ignore */ }
    setUpdating(null)
  }

  async function toggleShowInSlider(id: string, current: boolean) {
    setUpdating(id)
    try {
      await fetch(`/api/moments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showInSlider: !current }),
      })
      await load()
    } catch { /* ignore */ }
    setUpdating(null)
  }

  async function deleteSubmission(id: string) {
    setDeleting(id)
    try {
      await fetch(`/api/moments/${id}`, { method: 'DELETE' })
      setConfirmDelete(null)
      await load()
    } catch { /* ignore */ }
    setDeleting(null)
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-800'}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moment Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review, approve, and manage customer moment submissions.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-semibold">No submissions yet</p>
          <p className="text-sm mt-1">Customer moment submissions will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-semibold text-gray-600">Image</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600">Name</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 hidden md:table-cell">Email</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 hidden lg:table-cell">Phone</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 hidden lg:table-cell">Occasion</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600 hidden sm:table-cell">Date</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-3 font-semibold text-gray-600">Slider</th>
                <th className="text-right py-3 px-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </td>
                  <td className="py-3 px-3 font-medium text-gray-900">{item.name}</td>
                  <td className="py-3 px-3 text-gray-500 hidden md:table-cell">{item.email || '—'}</td>
                  <td className="py-3 px-3 text-gray-500 hidden lg:table-cell">{item.phone || '—'}</td>
                  <td className="py-3 px-3 text-gray-500 hidden lg:table-cell">{item.occasionType}</td>
                  <td className="py-3 px-3 text-gray-500 hidden sm:table-cell whitespace-nowrap">
                    {new Date(item.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className={statusBadge(item.status)}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => toggleShowInSlider(item.id, item.showInSlider)}
                      disabled={updating === item.id || item.status !== 'approved'}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                        item.showInSlider ? 'bg-[#FE7501]' : 'bg-gray-200'
                      }`}
                      role="switch"
                      aria-checked={item.showInSlider}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          item.showInSlider ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(item.id, 'approved')}
                            disabled={updating === item.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(item.id, 'rejected')}
                            disabled={updating === item.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === 'rejected' && (
                        <button
                          onClick={() => updateStatus(item.id, 'approved')}
                          disabled={updating === item.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {confirmDelete === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteSubmission(item.id)}
                            disabled={deleting === item.id}
                            className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                          >
                            {deleting === item.id ? '...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

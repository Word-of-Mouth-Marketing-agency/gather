'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useCustomerSession } from '@/lib/customer-auth'
import PageTitleSection from '@/components/PageTitleSection'
import SignInPrompt from '@/components/SignInPrompt'
import type { Address } from '@/types'
import { useLocale } from '@/components/LocaleProvider'

const DELIVERY_CITIES = ['Dokki', 'Mohandessin', 'Manial', 'Zamalek', 'Haram'] as const

export default function AddressesPage() {
  const { locale, href, t } = useLocale()
  const session = useCustomerSession()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', city: '', street: '', apartment: '', phone: '', isDefault: false })
  const [saving, setSaving] = useState(false)

  const loadAddresses = useCallback(() => {
    if (!session) return
    fetch(`/api/customer/addresses?customerId=${encodeURIComponent(session.id)}`)
      .then((r) => r.json())
      .then((data) => { setAddresses(Array.isArray(data) ? data : []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [session])

  useEffect(() => {
    if (!session) return
    loadAddresses()
  }, [session, loadAddresses])

  function resetForm() {
    setForm({ label: '', city: '', street: '', apartment: '', phone: '', isDefault: false })
    setEditingId(null)
    setShowForm(false)
  }

  function openEdit(addr: Address) {
    setForm({ label: addr.label, city: addr.city, street: addr.street, apartment: addr.apartment || '', phone: addr.phone, isDefault: addr.isDefault })
    setEditingId(addr.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await fetch('/api/customer/addresses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: session!.id, addressId: editingId, ...form }),
        })
      } else {
        await fetch('/api/customer/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: session!.id, ...form }),
        })
      }
      resetForm()
      loadAddresses()
    } catch {} finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('addresses.deleteConfirm'))) return
    try {
      await fetch(`/api/customer/addresses?customerId=${encodeURIComponent(session!.id)}&addressId=${encodeURIComponent(id)}`, { method: 'DELETE' })
      loadAddresses()
    } catch {}
  }

  if (!session) return <SignInPrompt />

  return (
    <>
      <PageTitleSection title={t('addresses.title')} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href={href('/my-account')} className="text-sm text-[#ff7a1a] font-semibold hover:underline">{t('orders.back')}</Link>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="gather-btn-primary text-sm py-2.5 px-5">
            {t('addresses.addShort')}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#7a6247]">{t('addresses.loading')}</div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📍</div>
            <h2 className="text-xl font-black text-[#171717]">{t('addresses.empty')}</h2>
            <p className="text-sm text-[#7a6247] mt-2">{t('addresses.emptyDesc')}</p>
            <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex mt-4 gather-btn-primary">
              {t('addresses.add')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id} className="gather-section p-5 rounded-3xl flex items-start justify-between gap-4">
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#171717]">{addr.label}</span>
                    {addr.isDefault && <span className="text-[10px] bg-[#ff7a1a]/10 text-[#ff7a1a] font-semibold px-2 py-0.5 rounded-full">{t('addresses.default')}</span>}
                  </div>
                  <p className="text-[#7a6247] mt-1">{addr.street}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                  <p className="text-[#7a6247]">{addr.city}</p>
                  <p className="text-[#7a6247]">{addr.phone}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(addr)} className="text-xs text-[#ff7a1a] font-semibold hover:underline">{t('addresses.edit')}</button>
                  <button onClick={() => handleDelete(addr.id)} className="text-xs text-red-500 font-semibold hover:underline">{t('addresses.delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
            <div className="relative z-10 w-full max-w-md rounded-3xl bg-white shadow-xl p-8">
              <h3 className="text-lg font-black text-[#171717] mb-4">{editingId ? t('addresses.edit') : t('addresses.add')}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('addresses.label')}</label>
                  <input type="text" value={form.label} onChange={(e) => setForm({...form, label: e.target.value})} required
                    className="w-full min-h-[45px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                    placeholder={t('addresses.labelPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('addresses.city')}</label>
                  <select value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} required
                    className="w-full min-h-[45px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors">
                    <option value="">{t('addresses.selectCity')}</option>
                    {DELIVERY_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('addresses.street')}</label>
                  <input type="text" value={form.street} onChange={(e) => setForm({...form, street: e.target.value})} required
                    className="w-full min-h-[45px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                    placeholder={t('addresses.streetPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('addresses.apartment')}</label>
                  <input type="text" value={form.apartment} onChange={(e) => setForm({...form, apartment: e.target.value})}
                    className="w-full min-h-[45px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors"
                    placeholder={t('addresses.apartmentPlaceholder')} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700">{t('addresses.phoneForAddress')}</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required
                    className="w-full min-h-[45px] rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-[#ff7a1a] focus:ring-2 focus:ring-[#ff7a1a]/20 transition-colors" />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({...form, isDefault: e.target.checked})}
                    className="accent-[#ff7a1a]" />
                  {t('addresses.setDefault')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="submit" disabled={saving}
                    className="py-3 rounded-full bg-[#ff7a1a] text-white font-black text-sm hover:bg-[#fe6c00] transition-all disabled:opacity-60">
                    {saving ? t('profile.saving') : editingId ? t('addresses.update') : t('addresses.addBtn')}
                  </button>
                  <button type="button" onClick={resetForm}
                    className="py-3 rounded-full border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

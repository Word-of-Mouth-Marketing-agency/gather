'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import CartIcon from '@/components/ui/CartIcon'
import { useCustomerSession } from '@/lib/customer-auth'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/shop-by-occasion', label: 'Shop by Occasion' },
  { href: '/shop-by-category', label: 'Shop by Category' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const session = useCustomerSession()

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/assets/gather/gather-logo.webp"
              alt="Gather"
              className="h-12 lg:h-14 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-150 ${
                  pathname === link.href
                    ? 'bg-[#fff4e8] text-[#ff7a1a]'
                    : 'text-[#333] hover:bg-[#fff4e8] hover:text-[#ff7a1a]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-0 sm:gap-1">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </button>

            {/* Account */}
            <Link
              href={session ? '/my-account' : '/login'}
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Account"
            >
              {session ? (
                <span className="w-5 h-5 rounded-full bg-[#ff7a1a] text-white text-[10px] font-bold flex items-center justify-center">
                  {session.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Wishlist"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Language */}
            <button
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Language"
              title="Language"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Cart */}
            <CartIcon />

            {/* Mobile burger */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
            >
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-5 h-0.5 bg-gray-700 mt-1" />
              <span className="block w-5 h-0.5 bg-gray-700 mt-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobile}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <aside
          className={`absolute right-0 top-0 flex h-dvh w-[min(86vw,360px)] flex-col bg-white shadow-[-18px_0_36px_rgba(0,0,0,0.16)] transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-hidden={!mobileOpen}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <img
              src="/assets/gather/gather-logo.webp"
              alt="Gather"
              className="h-11 w-auto"
            />
            <button
              type="button"
              onClick={closeMobile}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff4e8] text-2xl leading-none text-[#171717]"
              aria-label="Close menu"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className={`px-4 py-3 rounded-2xl text-sm font-bold transition-colors ${
                  pathname === link.href
                    ? 'bg-[#fff4e8] text-[#ff7a1a]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            </nav>

            <div className="mt-6 border-t border-gray-100 pt-5">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-[#7a6247]">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { closeMobile(); setSearchOpen(true) }}
                  className="rounded-2xl border border-[#f1e2d3] bg-[#fffaf3] px-3 py-3 text-left text-sm font-bold text-[#171717]"
                >
                  Search
                </button>
                <Link
                  href={session ? '/my-account' : '/login'}
                  onClick={closeMobile}
                  className="rounded-2xl border border-[#f1e2d3] bg-[#fffaf3] px-3 py-3 text-sm font-bold text-[#171717]"
                >
                  Account
                </Link>
                <Link
                  href="/wishlist"
                  onClick={closeMobile}
                  className="rounded-2xl border border-[#f1e2d3] bg-[#fffaf3] px-3 py-3 text-sm font-bold text-[#171717]"
                >
                  Wishlist
                </Link>
                <Link
                  href="/cart"
                  onClick={closeMobile}
                  className="rounded-2xl border border-[#f1e2d3] bg-[#fffaf3] px-3 py-3 text-sm font-bold text-[#171717]"
                >
                  Cart
                </Link>
                <button
                  type="button"
                  className="col-span-2 rounded-2xl border border-[#f1e2d3] bg-white px-3 py-3 text-left text-sm font-bold text-[#171717]"
                >
                  Language
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-lg px-4 sm:px-6 lg:px-8 py-4 z-50">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff7a1a]/30 focus:border-[#ff7a1a]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#ff7a1a] text-white text-sm font-semibold hover:bg-[#e0660f] transition-colors"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery('') }}
              className="px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors text-sm"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </header>
  )
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseAdminSessionToken } from '@/lib/admin-session'

const ADMIN_LOGIN = '/admin/login'
const ADMIN_PREFIX = '/admin'
const AR_PREFIX = '/ar'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith(AR_PREFIX)) {
    const stripped = pathname.replace(AR_PREFIX, '') || '/'

    if (stripped.startsWith('/admin')) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }

    if (stripped.startsWith('/api')) {
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-gather-locale', 'ar')
      const newUrl = request.nextUrl.clone()
      newUrl.pathname = stripped
      return NextResponse.rewrite(newUrl, { request: { headers: requestHeaders } })
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-gather-locale', 'ar')
    const newUrl = request.nextUrl.clone()
    newUrl.pathname = stripped
    const response = NextResponse.rewrite(newUrl, { request: { headers: requestHeaders } })
    response.cookies.set('gather_locale', 'ar', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
    return response
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (pathname === ADMIN_LOGIN) return NextResponse.next()

    const session = request.cookies.get('gather_admin_session')?.value
    if (!session) {
      const loginUrl = new URL(ADMIN_LOGIN, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const payload = await parseAdminSessionToken(session)
      if (!payload) {
        const loginUrl = new URL(ADMIN_LOGIN, request.url)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = new URL(ADMIN_LOGIN, request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/ar/:path*', '/admin/:path*'],
}

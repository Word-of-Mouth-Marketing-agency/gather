import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseAdminSessionToken } from '@/lib/admin-session'

const ADMIN_LOGIN = '/admin/login'
const ADMIN_PREFIX = '/admin'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next()
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

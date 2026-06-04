import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_LOGIN = '/admin/login'
const ADMIN_PREFIX = '/admin'

export function middleware(request: NextRequest) {
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
    const payload = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'))
    if (payload.exp < Date.now()) {
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

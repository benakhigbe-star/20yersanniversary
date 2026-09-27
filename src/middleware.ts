import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { GUEST_COOKIE_NAME, ADMIN_COOKIE_NAME } from '@/lib/auth/constants';

const GUEST_PROTECTED_PREFIXES = [
  '/dashboard',
  '/my-cruise',
  '/actions',
  '/activities',
  '/schedule',
  '/guide',
  '/packing',
  '/announcements',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Admin area -----------------------------------------------------
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = token
      ? await verifyToken(token, process.env.ADMIN_SESSION_SECRET ?? '')
      : null;

    if (isLoginPage) {
      if (session) return NextResponse.redirect(new URL('/admin', req.url));
      return NextResponse.next();
    }
    if (!session) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // --- Guest login page -------------------------------------------------
  if (pathname === '/') {
    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const session = token
      ? await verifyToken(token, process.env.GUEST_SESSION_SECRET ?? '')
      : null;
    if (session) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }

  // --- Guest protected pages -------------------------------------------
  if (GUEST_PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const session = token
      ? await verifyToken(token, process.env.GUEST_SESSION_SECRET ?? '')
      : null;
    if (!session) {
      const url = new URL('/', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/my-cruise/:path*',
    '/actions/:path*',
    '/activities/:path*',
    '/schedule/:path*',
    '/guide/:path*',
    '/packing/:path*',
    '/announcements/:path*',
    '/admin/:path*',
  ],
};

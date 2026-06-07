import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const PROTECTED_PREFIXES = [
  '/sistema',
  '/tickets',
  '/cash-register',
  '/clients',
  '/reports',
  '/users',
  '/roles',
  '/attendance',
  '/settings',
  '/subscribers',
];

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  if (pathname === '/tickets' || pathname.startsWith('/tickets/')) {
    return NextResponse.redirect(new URL('/sistema', request.url));
  }

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublic && token) {
    return NextResponse.redirect(new URL('/sistema', request.url));
  }

  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/sistema', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};

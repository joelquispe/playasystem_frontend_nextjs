import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/tickets',
  '/cash-register',
  '/clients',
  '/reports',
  '/users',
  '/attendance',
  '/settings',
];

// Routes that are only accessible to admins
const ADMIN_ROUTES = ['/reports', '/users', '/attendance', '/settings', '/clients'];

// Public routes (no auth needed)
const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (isPublic && token) {
    return NextResponse.redirect(new URL('/tickets', request.url));
  }

  // Root redirect
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/tickets', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

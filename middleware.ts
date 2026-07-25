import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route Protection Matchers:
 * - Public: /, /shop, /category, /product, /about, /contact, /search, /login, /admin/login, /admin/unauthorized
 * - Customer Protected: /account, /orders, /wishlist, /cart, /checkout
 * - Admin Protected: /admin/* (except public admin routes)
 */
const isCustomerProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/orders(.*)',
  '/wishlist(.*)',
  '/cart(.*)',
  '/checkout(.*)',
]);

const isAdminProtectedRoute = createRouteMatcher(['/admin(.*)']);

const isAdminPublicRoute = createRouteMatcher(['/admin/login', '/admin/unauthorized']);

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const secretKey = process.env.CLERK_SECRET_KEY || '';

const isRealClerkKey =
  Boolean(publishableKey) &&
  Boolean(secretKey) &&
  publishableKey.startsWith('pk_') &&
  !publishableKey.includes('placeholder') &&
  !publishableKey.includes('navyacollection');

const clerkHandler = clerkMiddleware((auth, req) => {
  const { userId, sessionClaims } = auth();
  const path = req.nextUrl.pathname;

  // 1. Admin Route Protection (/admin/*)
  if (isAdminProtectedRoute(req) && !isAdminPublicRoute(req)) {
    if (!userId) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }

    const role = (sessionClaims?.metadata as any)?.role || (sessionClaims as any)?.role;
    if (
      role &&
      role !== 'admin' &&
      role !== 'super_admin' &&
      role !== 'ADMIN' &&
      role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
    }
  }

  // 2. Customer Route Protection (/account, /orders, /wishlist, /cart, /checkout)
  if (isCustomerProtectedRoute(req)) {
    if (!userId) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }
});

export default async function middleware(req: NextRequest) {
  if (!isRealClerkKey) {
    return NextResponse.next();
  }

  try {
    return await clerkHandler(req, {} as any);
  } catch (error) {
    console.warn('⚠️ Clerk Middleware Warning:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

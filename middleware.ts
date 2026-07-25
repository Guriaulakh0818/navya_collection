import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/', '/shop', '/about', '/contact'];
const protectedPrefixes = ['/account', '/orders', '/wishlist', '/cart', '/checkout'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  const isPublic = publicRoutes.includes(request.nextUrl.pathname);
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|fonts|icons|logos|banners|.*\\..*).*)',
  ],
};

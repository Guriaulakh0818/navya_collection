import { NextRequest, NextResponse } from 'next/server';

import { isAuthenticated } from '@/features/auth/utils/session';

const publicRoutes = ['/login', '/', '/shop', '/about', '/contact', '/api/auth'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await isAuthenticated();

  const isPublicRoute = publicRoutes.some((route) => path === route || path.startsWith(route));
  const isAuthRoute = authRoutes.includes(path);

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|fonts|icons|logos|banners).*)'],
};

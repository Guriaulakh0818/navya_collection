import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const currentHost = hostname.split(':')[0].toLowerCase();
  const { pathname } = url;

  // Skip static assets, _next internal files, API routes, and public files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. ADMIN SUBDOMAIN (admin.navyacollection.store)
  if (currentHost === 'admin.navyacollection.store' || currentHost.startsWith('admin.')) {
    // If root '/', rewrite to /admin/dashboard
    if (pathname === '/') {
      url.pathname = '/admin/dashboard';
      return NextResponse.rewrite(url);
    }
    // If path doesn't start with /admin, prefix with /admin
    if (!pathname.startsWith('/admin')) {
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 2. SELLER SUBDOMAIN (seller.navyacollection.store)
  if (currentHost === 'seller.navyacollection.store' || currentHost.startsWith('seller.')) {
    // If root '/', rewrite to /become-seller or /seller/dashboard
    if (pathname === '/') {
      url.pathname = '/become-seller';
      return NextResponse.rewrite(url);
    }
    // If path doesn't start with /seller and not /become-seller
    if (!pathname.startsWith('/seller') && !pathname.startsWith('/become-seller')) {
      url.pathname = `/seller${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|manifest.webmanifest).*)'],
};

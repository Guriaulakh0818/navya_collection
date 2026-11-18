import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { logSecurityEvent } from '@/backend/security/audit-logger';
import { validateCsrfOrigin } from '@/backend/security/csrf-protection';
import { checkRateLimit, RATE_LIMIT_POLICIES } from '@/backend/security/rate-limiter';

const SESSION_COOKIE_NAME = 'navya_session';
const ADMIN_COOKIE = 'navya_admin_session';

const STORE_ORIGIN = 'https://jiivaakart.com';
const ADMIN_ORIGIN = 'https://admin.jiivaakart.com';
const SELLER_ORIGIN = 'https://seller.jiivaakart.com';

const CUSTOMER_PROTECTED_PREFIXES = [
  '/account',
  '/orders',
  '/profile',
  '/wishlist',
  '/checkout',
  '/addresses',
];

const PROTECTED_API_PREFIXES = [
  '/api/v1/user',
  '/api/v1/orders',
  '/api/v1/account',
  '/api/v1/checkout',
  '/api/v1/addresses',
  '/api/v1/wishlist',
  '/api/v1/cart',
  '/api/v1/admin',
  '/api/v1/seller',
];

const PUBLIC_API_EXCEPTIONS = [
  '/api/v1/auth/send-otp',
  '/api/v1/auth/verify-otp',
  '/api/v1/auth/google',
  '/api/v1/admin/auth/login',
  '/api/v1/admin/auth/set-password',
  '/api/v1/admin/marketing/notifications/cadence',
  '/api/v1/admin/finance/settlements/cron',
  '/api/v1/admin/categories/sync',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/v1/webhooks/',
  '/api/v1/seller/auth/login-password',
  '/api/v1/seller/register',
  '/api/v1/seller/status',
  '/api/v1/seller/verify',
];

const ADMIN_PUBLIC_PAGES = ['/admin/login', '/admin/set-password', '/admin/unauthorized'];

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'FATAL SECURITY MISCONFIGURATION: JWT_SECRET environment variable must be defined in production.',
      );
    }
    return new TextEncoder().encode('dev_only_jwt_secret_key_change_in_production_32chars');
  }
  return new TextEncoder().encode(secret);
}

export default async function middleware(req: NextRequest) {
  // CVE-2025-29927: Mitigate middleware bypass attacks by blocking external x-middleware-subrequest header
  if (req.headers.has('x-middleware-subrequest')) {
    return new NextResponse('Forbidden: Invalid middleware header', { status: 403 });
  }

  const { pathname } = req.nextUrl;
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || (req as any).ip || '127.0.0.1';

  // 1. Extract Hostname, Protocol and Detect Subdomains
  const rawHost =
    req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.hostname || '';
  const currentHost = rawHost.split(',')[0].split(':')[0].trim().toLowerCase();
  const proto = (
    req.headers.get('x-forwarded-proto') ||
    req.nextUrl.protocol.replace(':', '') ||
    'https'
  ).toLowerCase();

  // 2. WWW CANONICALIZATION (www.jiivaakart.com & legacy www.navyacollection.store -> jiivaakart.com)
  if (currentHost === 'www.jiivaakart.com' || currentHost === 'www.navyacollection.store') {
    const canonicalUrl = new URL(`${pathname}${req.nextUrl.search}`, STORE_ORIGIN);
    return NextResponse.redirect(canonicalUrl, 308);
  }

  // 3. PRODUCTION HTTP → HTTPS ENFORCEMENT
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    const httpsUrl = new URL(
      `${pathname}${req.nextUrl.search}`,
      `https://${currentHost || 'jiivaakart.com'}`,
    );
    return NextResponse.redirect(httpsUrl, 308);
  }

  // 4. Skip static assets, internal Next.js files, and public favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isAdminSubdomain =
    currentHost === 'admin.jiivaakart.com' ||
    currentHost === 'admin.navyacollection.store' ||
    currentHost.startsWith('admin.');

  const isSellerSubdomain =
    currentHost === 'seller.jiivaakart.com' ||
    currentHost === 'seller.navyacollection.store' ||
    currentHost.startsWith('seller.');

  // 5. PRODUCTION SUBDOMAIN CANONICAL REDIRECTIONS:
  // Only redirect from canonical primary storefront domains (jiivaakart.com / navyacollection.store).
  // Exclude Vercel preview domains (*.vercel.app) and local development to prevent cross-origin breakage.
  const isVercelOrLocal =
    currentHost.endsWith('.vercel.app') ||
    currentHost.includes('localhost') ||
    currentHost.includes('127.0.0.1');
  const isCanonicalCustomerDomain =
    currentHost === 'jiivaakart.com' ||
    currentHost === 'www.jiivaakart.com' ||
    currentHost === 'navyacollection.store' ||
    currentHost === 'www.navyacollection.store';

  // Universal redirect for legacy or email /sellers links to /admin/sellers
  if (pathname === '/sellers' || pathname.startsWith('/sellers/')) {
    const adminPath = `/admin${pathname}`;
    const targetUrl =
      process.env.NODE_ENV === 'production' && !isVercelOrLocal
        ? new URL(adminPath, ADMIN_ORIGIN)
        : new URL(adminPath, req.url);
    req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
    return NextResponse.redirect(targetUrl, 307);
  }

  if (
    process.env.NODE_ENV === 'production' &&
    isCanonicalCustomerDomain &&
    !isAdminSubdomain &&
    !isSellerSubdomain &&
    !isVercelOrLocal
  ) {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const targetUrl = new URL(pathname, ADMIN_ORIGIN);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }

    if (pathname === '/seller' || pathname.startsWith('/seller/')) {
      const subPath = pathname.replace(/^\/seller/, '') || '/';
      const targetUrl = new URL(subPath, SELLER_ORIGIN);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
  }

  // 6. Subdomain Landing & Path Normalization
  if (isAdminSubdomain) {
    if (pathname === '/' || pathname === '/dashboard') {
      const targetUrl = new URL('/admin/dashboard', req.url);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
    if (pathname === '/login') {
      const targetUrl = new URL('/admin/login', req.url);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
    if (pathname === '/set-password') {
      const targetUrl = new URL('/admin/set-password', req.url);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      const targetUrl = new URL(`/admin${pathname}`, req.url);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
  }

  if (isSellerSubdomain) {
    if (pathname === '/home') {
      const targetUrl = new URL('/', STORE_ORIGIN);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
    if (pathname === '/register') {
      const targetUrl = new URL('/become-seller', req.url);
      req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
      return NextResponse.redirect(targetUrl, 307);
    }
  }

  let effectivePathname = pathname;
  let shouldRewrite = false;
  const rewriteUrl = req.nextUrl.clone();

  // Support /home path on main store
  if (!isAdminSubdomain && !isSellerSubdomain && pathname === '/home') {
    rewriteUrl.pathname = '/';
    effectivePathname = '/';
    shouldRewrite = true;
  }

  if (isSellerSubdomain) {
    if (pathname === '/' || pathname === '/register') {
      rewriteUrl.pathname = '/become-seller';
      effectivePathname = '/become-seller';
      shouldRewrite = true;
    } else if (pathname === '/login') {
      rewriteUrl.pathname = '/login';
      effectivePathname = '/login';
      shouldRewrite = true;
    } else if (
      !pathname.startsWith('/seller') &&
      !pathname.startsWith('/become-seller') &&
      !pathname.startsWith('/seller-agreement') &&
      !pathname.startsWith('/api')
    ) {
      rewriteUrl.pathname = `/seller${pathname}`;
      effectivePathname = `/seller${pathname}`;
      shouldRewrite = true;
    }
  }

  // 7. CSRF Origin Verification on state-mutating requests
  const isCsrfValid = validateCsrfOrigin(
    effectivePathname,
    req.method,
    req.headers.get('origin'),
    req.headers.get('referer'),
    req.headers.get('authorization'),
  );

  if (!isCsrfValid) {
    logSecurityEvent(
      'CSRF_VIOLATION',
      `CSRF validation failed on ${req.method} ${effectivePathname}`,
      { ip },
    );
    return NextResponse.json(
      { success: false, message: 'Invalid origin or referer header. CSRF check failed.' },
      { status: 403 },
    );
  }

  // 8. Rate Limiting Checks for sensitive endpoints
  if (effectivePathname.includes('/auth/send-otp')) {
    const rateCheck = checkRateLimit(
      `otp:${ip}`,
      RATE_LIMIT_POLICIES.OTP.limit,
      RATE_LIMIT_POLICIES.OTP.windowMs,
    );
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', `OTP rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        {
          success: false,
          status: 'COOLDOWN',
          message: 'Too many OTP requests. Please wait 10 minutes before trying again.',
        },
        { status: 429 },
      );
    }
  } else if (
    effectivePathname.includes('/auth/login') ||
    effectivePathname.includes('/admin/login')
  ) {
    const rateCheck = checkRateLimit(
      `login:${ip}`,
      RATE_LIMIT_POLICIES.LOGIN.limit,
      RATE_LIMIT_POLICIES.LOGIN.windowMs,
    );
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', `Login rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: 'Too many login attempts. Please wait 10 minutes.' },
        { status: 429 },
      );
    }
  } else if (effectivePathname.startsWith('/api/v1/checkout')) {
    const rateCheck = checkRateLimit(
      `checkout:${ip}`,
      RATE_LIMIT_POLICIES.CHECKOUT.limit,
      RATE_LIMIT_POLICIES.CHECKOUT.windowMs,
    );
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', `Checkout rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: 'Too many checkout requests. Please wait.' },
        { status: 429 },
      );
    }
  } else if (effectivePathname.startsWith('/api/v1/contact')) {
    const rateCheck = checkRateLimit(
      `contact:${ip}`,
      RATE_LIMIT_POLICIES.CONTACT.limit,
      RATE_LIMIT_POLICIES.CONTACT.windowMs,
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many contact submissions. Please wait 10 minutes.' },
        { status: 429 },
      );
    }
  } else if (effectivePathname.startsWith('/api/v1/reviews')) {
    const rateCheck = checkRateLimit(
      `reviews:${ip}`,
      RATE_LIMIT_POLICIES.REVIEWS.limit,
      RATE_LIMIT_POLICIES.REVIEWS.windowMs,
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many review submissions. Please wait 10 minutes.' },
        { status: 429 },
      );
    }
  } else if (effectivePathname.startsWith('/api/v1/search')) {
    const rateCheck = checkRateLimit(
      `search:${ip}`,
      RATE_LIMIT_POLICIES.SEARCH.limit,
      RATE_LIMIT_POLICIES.SEARCH.windowMs,
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: 'Search rate limit exceeded. Please slow down.' },
        { status: 429 },
      );
    }
  } else if (effectivePathname.startsWith('/api/v1/admin')) {
    const hasAdminCookie = Boolean(
      req.cookies.get(ADMIN_COOKIE)?.value || req.cookies.get(SESSION_COOKIE_NAME)?.value,
    );
    const adminLimit = hasAdminCookie ? 600 : RATE_LIMIT_POLICIES.ADMIN_API.limit;
    const rateCheck = checkRateLimit(
      `admin_api:${ip}`,
      adminLimit,
      RATE_LIMIT_POLICIES.ADMIN_API.windowMs,
    );
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', `Admin API rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: 'Admin API rate limit exceeded. Please wait a moment.' },
        { status: 429 },
      );
    }
  }

  // 9. Edge JWT Verification (Supports Bearer token for Mobile App + separate cookies for Admin/Customer)
  const isAdminPath =
    effectivePathname.startsWith('/admin') || effectivePathname.startsWith('/api/v1/admin');
  const authHeader = req.headers.get('authorization');
  const bearerToken =
    authHeader && authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : undefined;

  const token =
    bearerToken ||
    (isAdminPath
      ? req.cookies.get(ADMIN_COOKIE)?.value || req.cookies.get(SESSION_COOKIE_NAME)?.value
      : req.cookies.get(SESSION_COOKIE_NAME)?.value);

  let isAuthenticated = false;
  let userRole = 'USER';
  let userId = '';

  if (token) {
    try {
      const secretKey = getJwtSecretKey();
      const { payload } = await jwtVerify(token, secretKey);

      if (payload && payload.userId) {
        isAuthenticated = true;
        userId = String(payload.userId);
        userRole = String(payload.role || 'USER');
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // 10. API Route Protection
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) =>
    effectivePathname.startsWith(prefix),
  );
  const isPublicApiException = PUBLIC_API_EXCEPTIONS.some((path) =>
    effectivePathname.startsWith(path),
  );

  if (isProtectedApi && !isPublicApiException) {
    if (!isAuthenticated) {
      logSecurityEvent('AUTH_FAILURE', `Unauthenticated access attempt to ${effectivePathname}`, {
        ip,
      });
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    if (effectivePathname.startsWith('/api/v1/admin')) {
      const allowedIpsEnv = process.env.ADMIN_ALLOWED_IPS;
      const isIpRestrictionEnabled = process.env.ENABLE_ADMIN_IP_RESTRICTION === 'true';
      if (allowedIpsEnv || isIpRestrictionEnabled) {
        const allowedList = (allowedIpsEnv || '')
          .split(',')
          .map((i) => i.trim())
          .filter(Boolean);
        const isIpAllowed =
          allowedList.length === 0 ||
          allowedList.includes(ip) ||
          (allowedList.includes('127.0.0.1') && (ip === '::1' || ip === '127.0.0.1'));
        if (!isIpAllowed) {
          logSecurityEvent('SUSPICIOUS_ACTIVITY', `Admin API IP allowlist block for IP ${ip}`, {
            ip,
            pathname: effectivePathname,
          });
          return NextResponse.json(
            { success: false, message: 'Access denied. IP address not allowed.' },
            { status: 403 },
          );
        }
      }

      const validAdminRoles = ['OWNER', 'ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'];
      if (!validAdminRoles.includes(userRole)) {
        logSecurityEvent('AUTH_FAILURE', `Unauthorized admin API attempt by user ${userId}`, {
          ip,
          role: userRole,
        });
        return NextResponse.json(
          { success: false, message: 'Access denied. Insufficient permissions.' },
          { status: 403 },
        );
      }

      // Enforce DELETE Protection: Only OWNER or SUPER_ADMIN can delete resources
      if (req.method === 'DELETE' && userRole !== 'OWNER' && userRole !== 'SUPER_ADMIN') {
        logSecurityEvent('AUTH_FAILURE', `Delete attempt blocked for non-owner role ${userRole}`, {
          ip,
          userId,
          pathname: effectivePathname,
        });
        return NextResponse.json(
          {
            success: false,
            message: 'Forbidden. Delete operations are restricted to the Owner only.',
          },
          { status: 403 },
        );
      }

      // Enforce SUPERVISOR Restrictions: Read-only except for processing orders
      if (
        userRole === 'SUPERVISOR' &&
        ['POST', 'PUT', 'PATCH'].includes(req.method) &&
        !effectivePathname.includes('/orders')
      ) {
        logSecurityEvent('AUTH_FAILURE', `Catalog mutation blocked for SUPERVISOR`, {
          ip,
          userId,
          pathname: effectivePathname,
        });
        return NextResponse.json(
          {
            success: false,
            message: 'Forbidden. Supervisor role is read-only for catalog management.',
          },
          { status: 403 },
        );
      }
    }

    if (
      effectivePathname.startsWith('/api/v1/seller') &&
      !effectivePathname.startsWith('/api/v1/seller/register') &&
      !effectivePathname.startsWith('/api/v1/seller/status') &&
      !effectivePathname.startsWith('/api/v1/seller/verify')
    ) {
      const validSellerRoles = ['SELLER', 'OWNER', 'ADMIN', 'SUPER_ADMIN'];
      if (!validSellerRoles.includes(userRole)) {
        logSecurityEvent('AUTH_FAILURE', `Unauthorized seller API attempt by user ${userId}`, {
          ip,
          role: userRole,
        });
        return NextResponse.json(
          { success: false, message: 'Access denied. Merchant / Seller role required.' },
          { status: 403 },
        );
      }
    }
  }

  // 11. Admin Page Protection
  if (effectivePathname.startsWith('/admin')) {
    const allowedIpsEnv = process.env.ADMIN_ALLOWED_IPS;
    const isIpRestrictionEnabled = process.env.ENABLE_ADMIN_IP_RESTRICTION === 'true';
    if (allowedIpsEnv || isIpRestrictionEnabled) {
      const allowedList = (allowedIpsEnv || '')
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean);
      const isIpAllowed =
        allowedList.length === 0 ||
        allowedList.includes(ip) ||
        (allowedList.includes('127.0.0.1') && (ip === '::1' || ip === '127.0.0.1'));
      if (!isIpAllowed) {
        logSecurityEvent('SUSPICIOUS_ACTIVITY', `Admin Page IP allowlist block for IP ${ip}`, {
          ip,
          pathname: effectivePathname,
        });
        return new NextResponse(
          'Access Denied: Your IP address is not authorized to access the Admin Panel.',
          { status: 403 },
        );
      }
    }

    const isAdminPublicPage = ADMIN_PUBLIC_PAGES.some((p) => effectivePathname.startsWith(p));
    if (!isAdminPublicPage) {
      if (!isAuthenticated) {
        const loginUrl = new URL('/admin/login', req.url);
        const targetRedirect = effectivePathname.startsWith('/admin')
          ? effectivePathname
          : `/admin${effectivePathname}`;
        if (
          targetRedirect !== '/admin' &&
          targetRedirect !== '/admin/dashboard' &&
          targetRedirect !== '/admin/login'
        ) {
          loginUrl.searchParams.set('redirectUrl', targetRedirect);
        }
        return NextResponse.redirect(loginUrl);
      }

      const validAdminRoles = ['OWNER', 'ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'];
      if (!validAdminRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }
    }
  }

  // 12. Seller Page Protection
  if (effectivePathname.startsWith('/seller')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirectUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const validSellerRoles = ['SELLER', 'OWNER', 'ADMIN', 'SUPER_ADMIN'];
    if (!validSellerRoles.includes(userRole)) {
      logSecurityEvent(
        'AUTH_FAILURE',
        `Customer attempt to access seller dashboard by user ${userId}`,
        { ip, role: userRole },
      );
      const targetPath = isSellerSubdomain ? '/' : '/become-seller';
      return NextResponse.redirect(new URL(targetPath, req.url));
    }
  }

  // 13. Customer Protected Page Protection
  const isCustomerProtected = CUSTOMER_PROTECTED_PREFIXES.some((prefix) =>
    effectivePathname.startsWith(prefix),
  );

  if (isCustomerProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 14. Build Final Response & Security Headers
  const requestHeaders = new Headers(req.headers);
  if (isAuthenticated) {
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-role', userRole);
  }

  const response = shouldRewrite
    ? NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      })
    : NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

  // OWASP Production Security Headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://www.google-analytics.com https://www.clarity.ms https://api.razorpay.com https://lumberjack.razorpay.com",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/(api|trpc)(.*)'],
};

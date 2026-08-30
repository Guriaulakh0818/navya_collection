import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import {
  checkRateLimit,
  logSecurityEvent,
  RATE_LIMIT_POLICIES,
  validateCsrfOrigin,
} from '@/backend/security';

const SESSION_COOKIE_NAME = 'navya_session';
const ADMIN_COOKIE = 'navya_admin_session';

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
  '/api/v1/admin/auth/login',
  '/api/auth/send-otp',
  '/api/auth/verify-otp',
  '/api/v1/webhooks/razorpay',
  '/api/v1/seller/register',
  '/api/v1/seller/status',
];

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || '127.0.0.1';

  // 1. Skip static assets, internal Next.js files, and public favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Extract Hostname and Detect Subdomains
  const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const currentHost = rawHost.split(':')[0].toLowerCase();

  const isAdminSubdomain =
    currentHost === 'admin.navyacollection.store' ||
    currentHost === 'admin.navyacollection.in' ||
    currentHost.startsWith('admin.');

  const isSellerSubdomain =
    currentHost === 'seller.navyacollection.store' ||
    currentHost === 'seller.navyacollection.in' ||
    currentHost.startsWith('seller.');

  // 3. PRODUCTION CANONICAL REDIRECTION:
  // If accessing /admin from the main domain or vercel.app, redirect immediately to custom admin subdomain
  if (
    process.env.NODE_ENV === 'production' &&
    !isAdminSubdomain &&
    (pathname === '/admin' || pathname.startsWith('/admin/'))
  ) {
    const subPath = pathname.replace(/^\/admin/, '') || '/';
    const targetUrl = new URL(subPath, 'https://admin.navyacollection.store');
    req.nextUrl.searchParams.forEach((val, key) => targetUrl.searchParams.set(key, val));
    return NextResponse.redirect(targetUrl, 307);
  }

  // 4. Subdomain Path Normalization and Rewriting
  let effectivePathname = pathname;
  let shouldRewrite = false;
  const rewriteUrl = req.nextUrl.clone();

  if (isAdminSubdomain) {
    if (pathname === '/') {
      rewriteUrl.pathname = '/admin/dashboard';
      effectivePathname = '/admin/dashboard';
      shouldRewrite = true;
    } else if (pathname === '/login') {
      rewriteUrl.pathname = '/admin/login';
      effectivePathname = '/admin/login';
      shouldRewrite = true;
    } else if (!pathname.startsWith('/admin') && !pathname.startsWith('/api')) {
      rewriteUrl.pathname = `/admin${pathname}`;
      effectivePathname = `/admin${pathname}`;
      shouldRewrite = true;
    }
  } else if (isSellerSubdomain) {
    if (pathname === '/') {
      rewriteUrl.pathname = '/become-seller';
      effectivePathname = '/become-seller';
      shouldRewrite = true;
    } else if (
      !pathname.startsWith('/seller') &&
      !pathname.startsWith('/become-seller') &&
      !pathname.startsWith('/api')
    ) {
      rewriteUrl.pathname = `/seller${pathname}`;
      effectivePathname = `/seller${pathname}`;
      shouldRewrite = true;
    }
  }

  // 5. CSRF Origin Verification on state-mutating requests
  const isCsrfValid = validateCsrfOrigin(
    effectivePathname,
    req.method,
    req.headers.get('origin'),
    req.headers.get('referer'),
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

  // 6. Rate Limiting Checks for sensitive endpoints
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
    const rateCheck = checkRateLimit(
      `admin_api:${ip}`,
      RATE_LIMIT_POLICIES.ADMIN_API.limit,
      RATE_LIMIT_POLICIES.ADMIN_API.windowMs,
    );
    if (!rateCheck.allowed) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', `Admin API rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { success: false, message: 'Admin API rate limit exceeded.' },
        { status: 429 },
      );
    }
  }

  // 7. Edge JWT Verification (Separate cookies for Admin and Customer)
  const isAdminPath =
    effectivePathname.startsWith('/admin') || effectivePathname.startsWith('/api/v1/admin');
  const token = isAdminPath
    ? req.cookies.get(ADMIN_COOKIE)?.value || req.cookies.get(SESSION_COOKIE_NAME)?.value
    : req.cookies.get(SESSION_COOKIE_NAME)?.value;

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

  // 8. API Route Protection
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
      !effectivePathname.startsWith('/api/v1/seller/status')
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

  // 9. Admin Page Protection
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

    if (effectivePathname !== '/admin/login') {
      if (!isAuthenticated) {
        if (isAdminSubdomain) {
          const loginUrl = new URL('/login', req.url);
          if (pathname !== '/' && pathname !== '/dashboard') {
            loginUrl.searchParams.set('redirectUrl', pathname);
          }
          return NextResponse.redirect(loginUrl);
        }
        const loginUrl = new URL('/admin/login', req.url);
        loginUrl.searchParams.set('redirectUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const validAdminRoles = ['OWNER', 'ADMIN', 'SUPERVISOR', 'SUPER_ADMIN'];
      if (!validAdminRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  }

  // 10. Seller Page Protection
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
      return NextResponse.redirect(new URL('/become-seller', req.url));
    }
  }

  // 11. Customer Protected Page Protection
  const isCustomerProtected = CUSTOMER_PROTECTED_PREFIXES.some((prefix) =>
    effectivePathname.startsWith(prefix),
  );

  if (isCustomerProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 12. Build Final Response & Security Headers
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
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://images.unsplash.com https://res.cloudinary.com https://*.razorpay.com",
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

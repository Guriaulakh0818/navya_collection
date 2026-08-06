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

  // 1. Skip static assets and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. CSRF Origin Verification on state-mutating requests
  const isCsrfValid = validateCsrfOrigin(
    pathname,
    req.method,
    req.headers.get('origin'),
    req.headers.get('referer'),
  );

  if (!isCsrfValid) {
    logSecurityEvent('CSRF_VIOLATION', `CSRF validation failed on ${req.method} ${pathname}`, {
      ip,
    });
    return NextResponse.json(
      { success: false, message: 'Invalid origin or referer header. CSRF check failed.' },
      { status: 403 },
    );
  }

  // 3. Rate Limiting Checks for sensitive endpoints
  if (pathname.includes('/auth/send-otp')) {
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
  } else if (pathname.includes('/auth/login') || pathname.includes('/admin/login')) {
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
  } else if (pathname.startsWith('/api/v1/checkout')) {
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
  } else if (pathname.startsWith('/api/v1/contact')) {
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
  } else if (pathname.startsWith('/api/v1/reviews')) {
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
  } else if (pathname.startsWith('/api/v1/search')) {
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
  } else if (pathname.startsWith('/api/v1/admin')) {
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

  // 4. Edge JWT Verification (Separate cookies for Admin and Customer)
  const ADMIN_COOKIE = 'navya_admin_session';
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/v1/admin');
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

  // 5. API Route Protection
  const isProtectedApi = PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isPublicApiException = PUBLIC_API_EXCEPTIONS.some((path) => pathname.startsWith(path));

  if (isProtectedApi && !isPublicApiException) {
    if (!isAuthenticated) {
      logSecurityEvent('AUTH_FAILURE', `Unauthenticated access attempt to ${pathname}`, { ip });
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    if (pathname.startsWith('/api/v1/admin')) {
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
            pathname,
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
          pathname,
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
        !pathname.includes('/orders')
      ) {
        logSecurityEvent('AUTH_FAILURE', `Catalog mutation blocked for SUPERVISOR`, {
          ip,
          userId,
          pathname,
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
      pathname.startsWith('/api/v1/seller') &&
      !pathname.startsWith('/api/v1/seller/register') &&
      !pathname.startsWith('/api/v1/seller/status')
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

  // 6. Admin Page Protection
  if (pathname.startsWith('/admin')) {
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
          pathname,
        });
        return new NextResponse(
          'Access Denied: Your IP address is not authorized to access the Admin Panel.',
          { status: 403 },
        );
      }
    }

    if (pathname !== '/admin/login') {
      if (!isAuthenticated) {
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

  // 7. Seller Page Protection
  if (pathname.startsWith('/seller')) {
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

  // 8. Customer Protected Page Protection
  const isCustomerProtected = CUSTOMER_PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isCustomerProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirectUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Pass request headers downstream with user context
  const requestHeaders = new Headers(req.headers);
  if (isAuthenticated) {
    requestHeaders.set('x-user-id', userId);
    requestHeaders.set('x-user-role', userRole);
  }

  const response = NextResponse.next({
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

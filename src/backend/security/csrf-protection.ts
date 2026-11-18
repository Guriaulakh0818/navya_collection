const WEBHOOK_EXEMPT_ROUTES = [
  '/api/v1/webhooks/',
  '/api/v1/shipping/webhook',
  '/api/v1/auth/google/mobile',
  '/api/v1/admin/marketing/notifications/cadence',
  '/api/v1/admin/finance/settlements/cron',
  '/api/v1/admin/categories/sync',
];

const ALLOWED_DOMAINS = ['localhost', 'jiivaakart.com', 'navyacollection.store', 'vercel.app'];

/**
 * Validates request Origin / Referer against whitelist for state-mutating requests
 */
export function validateCsrfOrigin(
  pathname: string,
  method: string,
  originHeader?: string | null,
  refererHeader?: string | null,
  authorizationHeader?: string | null,
): boolean {
  // 1. Skip GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return true;
  }

  // 2. Skip Webhooks, Cron, and Native Mobile Auth endpoints
  if (WEBHOOK_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // 3. Bearer token requests (Mobile App / Server-to-Server) are immune to cookie-based CSRF
  if (authorizationHeader && authorizationHeader.toLowerCase().startsWith('bearer ')) {
    return true;
  }

  // 4. In non-browser API calls or missing headers, enforce stricter check in prod
  const targetHeader = originHeader || refererHeader;
  if (!targetHeader) {
    // Fail if missing origin on state-mutating POST/PUT/DELETE in production
    return process.env.NODE_ENV !== 'production';
  }

  try {
    const url = new URL(targetHeader);
    const hostname = url.hostname.toLowerCase();

    return ALLOWED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

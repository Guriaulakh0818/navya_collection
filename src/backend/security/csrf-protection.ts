const WEBHOOK_EXEMPT_ROUTES = ['/api/v1/webhooks/razorpay', '/api/v1/shipping/webhook'];

const ALLOWED_DOMAINS = ['localhost', 'navyacollection.in', 'navyacollection.store', 'vercel.app'];

/**
 * Validates request Origin / Referer against whitelist for state-mutating requests
 */
export function validateCsrfOrigin(
  pathname: string,
  method: string,
  originHeader?: string | null,
  refererHeader?: string | null,
): boolean {
  // 1. Skip GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return true;
  }

  // 2. Skip Webhooks
  if (WEBHOOK_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // 3. In non-browser API calls (curl/mobile apps) or missing headers, enforce stricter check in prod
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

import { ZodSchema } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { logSecurityEvent } from './audit-logger';
import { checkRateLimit, RateLimitPolicy } from './rate-limiter';
import { captureSecurityError } from './sentry-monitoring';
import { sanitizeObject } from './xss-sanitizer';

export interface SecurityOptions<T = any> {
  schema?: ZodSchema<T>;
  roles?: ('USER' | 'ADMIN' | 'SUPER_ADMIN')[];
  rateLimitPolicy?: RateLimitPolicy;
  requireAuth?: boolean;
}

export type AuthenticatedContext = {
  userId?: string;
  userRole?: string;
};

/**
 * Enterprise API Security Wrapper for Next.js 15 App Router API Handlers
 */
export function withApiSecurity<T = any>(
  handler: (req: NextRequest, body: T, ctx: AuthenticatedContext) => Promise<NextResponse>,
  options: SecurityOptions<T> = {},
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.ip || '127.0.0.1';
    const userId = req.headers.get('x-user-id') || undefined;
    const userRole = req.headers.get('x-user-role') || undefined;

    // 1. Authentication Check
    if (options.requireAuth && !userId) {
      logSecurityEvent('AUTH_FAILURE', `Unauthorized API access to ${req.nextUrl.pathname}`, {
        ip,
      });
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    // 2. Authorization Check (RBAC)
    if (options.roles && options.roles.length > 0) {
      const allowed = userRole && options.roles.includes(userRole as any);
      if (!allowed) {
        logSecurityEvent('AUTH_FAILURE', `Forbidden API access to ${req.nextUrl.pathname}`, {
          ip,
          userId,
          userRole,
          requiredRoles: options.roles,
        });
        return NextResponse.json(
          { success: false, message: 'Access denied. Insufficient permissions.' },
          { status: 403 },
        );
      }
    }

    // 3. Rate Limiting Check
    if (options.rateLimitPolicy) {
      const { key, limit, windowMs } = options.rateLimitPolicy;
      const rateCheck = checkRateLimit(`${key}:${ip}`, limit, windowMs);
      if (!rateCheck.allowed) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', `Rate limit exceeded on ${req.nextUrl.pathname}`, {
          ip,
        });
        return NextResponse.json(
          {
            success: false,
            message: 'Too many requests. Please slow down.',
            resetMs: rateCheck.resetMs,
          },
          { status: 429 },
        );
      }
    }

    // 4. Input Payload Parsing & Zod Validation
    let body: any = {};
    if (['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase())) {
      try {
        const rawBody = await req.json();
        body = sanitizeObject(rawBody);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Invalid JSON payload provided.' },
          { status: 400 },
        );
      }

      if (options.schema) {
        const parseResult = options.schema.safeParse(body);
        if (!parseResult.success) {
          const errors = parseResult.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }));
          return NextResponse.json(
            { success: false, message: 'Input validation failed.', errors },
            { status: 422 },
          );
        }
        body = parseResult.data;
      }
    }

    // 5. Execute Handler with Exception Boundary
    try {
      return await handler(req, body as T, { userId, userRole });
    } catch (err: any) {
      captureSecurityError(err, { pathname: req.nextUrl.pathname, ip, userId });

      const isProd = process.env.NODE_ENV === 'production';
      const errorMessage = isProd
        ? 'An internal server error occurred.'
        : err?.message || 'Server Error';

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          ...(isProd ? {} : { stack: err?.stack }),
        },
        { status: 500 },
      );
    }
  };
}

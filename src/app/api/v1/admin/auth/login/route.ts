import { NextRequest, NextResponse } from 'next/server';

import { AdminAuthService, adminLoginSchema } from '@/features/admin/services/admin-auth.service';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/v1/admin/auth/login
 *
 * Production Admin Authentication API for Navya Collection.
 * Validates admin email & password using Zod, normalizes email, performs bcrypt password check,
 * enforces account lockouts (max 5 failed attempts), and sets secure HTTP-Only session cookie.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';

    if (!isDev && !isLocalhost) {
      const rateCheck = checkRateLimit(`admin_login_${clientIp}`, {
        limit: 10,
        windowMs: 15 * 60 * 1000,
      });

      if (!rateCheck.success) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Too many admin login attempts from this IP. Please try again after 15 minutes.',
          },
          { status: 429 },
        );
      }
    }
    const body = await request.json().catch(() => ({}));
    const validation = adminLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please enter a valid email and password (minimum 6 characters).',
        },
        { status: 400 },
      );
    }

    const { email, password } = validation.data;
    const result = await AdminAuthService.login(email, password);

    if (result.success && result.user) {
      const response = NextResponse.json(
        {
          success: true,
          message: result.message,
          mustChangePassword: result.mustChangePassword || false,
          user: result.user,
        },
        { status: 200 },
      );

      if (result.token) {
        response.cookies.set('navya_admin_session', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        });
        response.cookies.set('navya_session', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        });
      }

      return response;
    }

    return NextResponse.json(
      {
        success: false,
        message: result.message,
      },
      { status: result.statusCode },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Admin authentication failed. Please try again later.',
      },
      { status: 500 },
    );
  }
}

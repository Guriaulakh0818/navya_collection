import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser, getCurrentUser } from '@/backend/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/auth/session
 *
 * Checks HTTP-Only session cookies (navya_admin_session / navya_session)
 * or Authorization Bearer token header, and returns authenticated user details.
 */
export async function GET(request: NextRequest) {
  try {
    const user = (await getAdminUser(request)) || (await getCurrentUser(undefined, request));

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          message: 'Session expired or not found',
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          name: user.name || 'User',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        authenticated: false,
        user: null,
        error: err?.message,
      },
      { status: 200 },
    );
  }
}

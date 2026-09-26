import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/session';

/**
 * GET /api/v1/auth/session
 *
 * Checks HTTP-Only session cookies (navya_admin_session / navya_session)
 * and returns authenticated user details.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          name: user.name || 'Admin',
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

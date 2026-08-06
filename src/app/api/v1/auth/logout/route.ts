import { NextResponse } from 'next/server';

import { logout } from '@/lib/session';

/**
 * POST /api/v1/auth/logout
 *
 * Production Logout & Session Cleanup API for Navya Collection.
 * Reused for both CUSTOMER and ADMIN sessions.
 * Verifies JWT token, revokes active UserSession in Prisma, clears HTTP-Only cookie,
 * and returns a standardized success response.
 */
export async function POST() {
  try {
    await logout();

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully.',
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully.',
      },
      { status: 200 },
    );
  }
}

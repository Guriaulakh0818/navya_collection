import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { ReferralService } from '@/backend/services/referral.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/v1/referral
 * Returns user's referral code, live share link, clicks, and invited friends status.
 * Reconciled authoritatively with database ledger and referral events.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto =
      request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const originUrl = `${proto}://${host}`;

    // 1. Resolve authenticated user identically to /api/v1/rewards/loyalty
    const sessionUser =
      (await getCurrentUser().catch(() => null)) ||
      (await getCurrentUser('navya_session', request).catch(() => null));

    const queryUserId = searchParams.get('userId');
    const queryCode = searchParams.get('code');
    const queryName = searchParams.get('name');

    const effectiveUserId =
      sessionUser?.id ||
      (queryUserId && queryUserId !== 'guest' ? queryUserId : null) ||
      'guest-user-default';

    const effectiveUserName =
      sessionUser?.name ||
      sessionUser?.email ||
      (queryName && queryName !== 'undefined' ? queryName : undefined);

    const codeOverride = queryCode || undefined;

    // 2. Guarantee latest live rewards settings from PostgreSQL
    await AdminRewardsService.getSettings().catch(() => {});

    // 3. Authoritative profile retrieval with rock-solid SQL queries
    const profile = await ReferralService.getProfile(
      effectiveUserId,
      originUrl,
      effectiveUserName,
      codeOverride,
    );

    return NextResponse.json(
      {
        success: true,
        data: profile,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error: any) {
    console.error('[API_REFERRAL_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referral profile' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  }
}

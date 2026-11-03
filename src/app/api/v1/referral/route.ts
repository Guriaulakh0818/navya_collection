import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { ReferralService } from '@/backend/services/referral.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/v1/referral
 * Returns user's referral code, live link, clicks, and invited friends status.
 * Reconciled authoritatively with database ledger and referral events.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto =
      request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const originUrl = `${proto}://${host}`;

    // 1. Resolve authenticated user from session cookie (matching /api/v1/rewards/loyalty)
    const sessionUser =
      (await getCurrentUser().catch(() => null)) ||
      (await getCurrentUser('navya_session', request).catch(() => null));

    const codeOverride = searchParams.get('code') || undefined;

    let userId =
      sessionUser?.id ||
      (searchParams.get('userId') && searchParams.get('userId') !== 'guest'
        ? (searchParams.get('userId') as string)
        : null) ||
      'guest-user-default';

    let userName = sessionUser?.name || sessionUser?.email || searchParams.get('name') || undefined;

    const userContact =
      sessionUser?.phone || sessionUser?.email || searchParams.get('contact') || undefined;

    // 2. If userId is still guest but a referral code was passed, resolve the actual owner from DB
    if ((!userId || userId.startsWith('guest')) && codeOverride) {
      const resolved = await ReferralService.findReferrer(codeOverride).catch(() => null);
      if (resolved?.userId) {
        userId = resolved.userId;
        if (!userName) userName = resolved.userName;
      }
    }

    // 3. Guarantee latest live rewards settings from PostgreSQL
    await AdminRewardsService.getSettings().catch(() => {});

    // 4. Authoritative profile retrieval with ledger reconciliation
    const profile = await ReferralService.getProfile(
      userId,
      originUrl,
      userName,
      codeOverride,
      userContact,
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

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { ReferralService } from '@/backend/services/referral.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto =
      request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const originUrl = `${proto}://${host}`;

    // Resolve authenticated user from session cookie with query param fallback
    const sessionUser = await getCurrentUser('navya_session', request).catch(() => null);
    const userId =
      sessionUser?.id ||
      (searchParams.get('userId') && searchParams.get('userId') !== 'guest'
        ? (searchParams.get('userId') as string)
        : null) ||
      'guest-user-default';
    const userName =
      sessionUser?.name || sessionUser?.email || searchParams.get('name') || undefined;
    const codeOverride = searchParams.get('code') || undefined;

    // Guarantee latest live rewards settings from PostgreSQL
    await AdminRewardsService.getSettings().catch(() => {});
    const profile = await ReferralService.getProfile(userId, originUrl, userName, codeOverride);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error('[API_REFERRAL_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch referral profile' },
      { status: 500 },
    );
  }
}

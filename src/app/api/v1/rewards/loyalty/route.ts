import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { LoyaltyService } from '@/backend/services/loyalty.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/rewards/loyalty
 * Returns authenticated user's 3-year loyalty cycle, live tier, cumulative spend,
 * coin balance, unlocked coupons, and next-order perks.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    const userId = user?.id || 'guest-anon';
    const account = await LoyaltyService.getAccount(userId);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('[API_REWARDS_LOYALTY_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loyalty account' },
      { status: 500 },
    );
  }
}

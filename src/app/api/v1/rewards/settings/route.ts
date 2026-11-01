import { NextResponse } from 'next/server';

import { AdminRewardsService } from '@/backend/services/admin-rewards.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await AdminRewardsService.getSettings();
    return NextResponse.json(
      {
        success: true,
        data: settings,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      },
    );
  } catch (error: any) {
    console.error('[API_REWARDS_SETTINGS_GET_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch rewards settings',
        data: {
          coinToInrRatio: 0.1,
          spendToCoinRatio: 10,
          maxOrderCoinRedemptionPct: 25,
          signupBonusCoins: 0,
          reviewBonusCoins: 1,
          firstOrderBonusCoins: 0,
          referralRefereeDiscountInr: 50,
          referralRefereeMinOrderInr: 499,
          referralReferrerBonusCoins: 500,
          tierValidityYears: 3,
        },
      },
      { status: 200 },
    );
  }
}

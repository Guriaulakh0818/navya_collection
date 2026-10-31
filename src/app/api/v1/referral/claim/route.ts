import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { ReferralService } from '@/backend/services/referral.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, friendName } = body;
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode || !cleanCode.startsWith('JIIVAA-')) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code' },
        { status: 400 },
      );
    }

    // Guarantee latest live rewards settings from PostgreSQL
    await AdminRewardsService.getSettings().catch(() => {});

    const cookieStore = await cookies();

    // Store in cookie for 30 days
    cookieStore.set('jiivaa_referral_code', cleanCode, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });

    // Record click and friend joined event
    await ReferralService.recordClick(cleanCode);
    const displayName = (friendName || 'Friend via Link').trim();
    await ReferralService.recordFriendJoined(cleanCode, displayName);

    const resolved = ReferralService.resolveReferrer(cleanCode);

    return NextResponse.json({
      success: true,
      message: `Welcome referral perk claimed! You got Flat ₹${resolved.discountInr} OFF.`,
      data: {
        code: cleanCode,
        referrerName: resolved.referrerName,
        discountInr: resolved.discountInr,
        minOrderInr: resolved.minOrderInr,
      },
    });
  } catch (err: any) {
    console.error('[API_REFERRAL_CLAIM_ERROR]', err);
    return NextResponse.json(
      { success: false, message: 'Failed to claim referral' },
      { status: 500 },
    );
  }
}

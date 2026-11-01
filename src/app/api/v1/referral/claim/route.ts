import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { ReferralService } from '@/backend/services/referral.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, friendName, userId: bodyUserId } = body;
    const cleanCode = (code || '')
      .trim()
      .toUpperCase()
      .replace(/^JIIVAA-/, '');

    if (!cleanCode || !ReferralService.isValidReferralCode(cleanCode)) {
      return NextResponse.json(
        { success: false, message: 'Invalid referral code. Please enter a valid code.' },
        { status: 400 },
      );
    }

    // Determine current user
    const sessionUser = await getCurrentUser('navya_session', request).catch(() => null);
    const activeUserId = bodyUserId || sessionUser?.id || undefined;
    const displayName = friendName || sessionUser?.name || sessionUser?.email || 'Friend';

    // Guarantee latest live rewards settings from PostgreSQL
    await AdminRewardsService.getSettings().catch(() => {});

    // Record click
    await ReferralService.recordClick(cleanCode);

    // Record friend joined and award 500 coins to referee + 100 coins to referrer
    const result = await ReferralService.recordFriendJoined({
      code: cleanCode,
      friendName: displayName,
      friendUserId: activeUserId,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const cookieStore = await cookies();
    // Store in cookie for 30 days
    cookieStore.set('jiivaa_referral_code', cleanCode, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
    });

    const resolved = await ReferralService.resolveReferrerAsync(cleanCode);

    return NextResponse.json({
      success: true,
      message: result.message,
      data: {
        code: cleanCode,
        referrerName: resolved.referrerName,
        discountInr: resolved.discountInr,
        minOrderInr: resolved.minOrderInr,
        coinsCredited: result.coinsCredited || 500,
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

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { AdminRewardsService } from '@/backend/services/admin-rewards.service';
import { ReferralService } from '@/backend/services/referral.service';
import { REWARDS_CONFIG } from '@/shared/config/rewards.config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cleanCode = (code || '')
    .trim()
    .toUpperCase()
    .replace(/^JIIVAA-/, '');
  const cookieStore = await cookies();

  // Record real link click
  await ReferralService.recordClick(cleanCode).catch(() => {});

  // Fetch live settings from DB
  const settings = await AdminRewardsService.getSettings().catch(() => null);
  const discountInr =
    settings?.referralRefereeDiscountInr || REWARDS_CONFIG.referralRefereeDiscountInr || 50;

  // Store referral code in cookie for 30 days
  cookieStore.set('jiivaa_referral_code', cleanCode, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  const host = request.headers.get('host') || 'localhost:3000';
  const proto =
    request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUrl = new URL('/shop', `${proto}://${host}`);
  redirectUrl.searchParams.set('ref', cleanCode);
  redirectUrl.searchParams.set('welcome_discount', String(discountInr));

  return NextResponse.redirect(redirectUrl);
}

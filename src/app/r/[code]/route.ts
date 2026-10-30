import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { ReferralService } from '@/backend/services/referral.service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const cookieStore = await cookies();

  // Record real link click and friend joined event in ReferralService
  await ReferralService.recordClick(code).catch(() => {});
  await ReferralService.recordFriendJoined(code, 'Friend via Link').catch(() => {});

  // Store referral code in cookie for 30 days
  cookieStore.set('jiivaa_referral_code', code, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });

  const host = request.headers.get('host') || 'localhost:3000';
  const proto =
    request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUrl = new URL('/shop', `${proto}://${host}`);
  redirectUrl.searchParams.set('ref', code);
  redirectUrl.searchParams.set('welcome_discount', '150');

  return NextResponse.redirect(redirectUrl);
}

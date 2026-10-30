import { NextResponse } from 'next/server';

import { ReferralService } from '@/backend/services/referral.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto =
      request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const originUrl = `${proto}://${host}`;
    const userId = searchParams.get('userId') || 'guest-user-default';
    const userName = searchParams.get('name') || undefined;
    const codeOverride = searchParams.get('code') || undefined;

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

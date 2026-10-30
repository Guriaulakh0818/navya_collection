import { NextRequest, NextResponse } from 'next/server';

import { ReferralService } from '@/backend/services/referral.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code') || '';

    const resolved = ReferralService.resolveReferrer(code);

    return NextResponse.json({
      success: true,
      data: resolved,
    });
  } catch (error: any) {
    console.error('[API_REFERRAL_RESOLVE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to resolve referral code' },
      { status: 500 },
    );
  }
}

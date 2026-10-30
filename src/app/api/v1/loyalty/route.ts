import { NextResponse } from 'next/server';

import { LoyaltyService } from '@/backend/services/loyalty.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'guest-user-default';

    const account = await LoyaltyService.getAccount(userId);

    return NextResponse.json({
      success: true,
      data: account,
    });
  } catch (error: any) {
    console.error('[API_LOYALTY_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch loyalty account' },
      { status: 500 },
    );
  }
}

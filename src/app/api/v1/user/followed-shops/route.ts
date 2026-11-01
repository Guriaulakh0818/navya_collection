import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { ShopFollowService } from '@/backend/services/shop-follow.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id || user.id.startsWith('guest')) {
      return NextResponse.json({
        success: true,
        data: { followedShopIds: [] },
      });
    }

    const followedShopIds = await ShopFollowService.getUserFollowedShopIds(user.id);

    return NextResponse.json({
      success: true,
      data: { followedShopIds },
    });
  } catch (error: any) {
    console.error('[USER_FOLLOWED_SHOPS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch followed shops' },
      { status: 500 },
    );
  }
}

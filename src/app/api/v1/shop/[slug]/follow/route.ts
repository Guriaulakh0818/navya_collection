import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { ShopFollowService } from '@/backend/services/shop-follow.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const cleanSlug = (slug || '').toLowerCase().trim();

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { id: cleanSlug }],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json({ success: false, message: 'Shop not found' }, { status: 404 });
    }

    const user = await getCurrentUser();
    const status = await ShopFollowService.getFollowStatus(shop.id, user?.id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('[SHOP_FOLLOW_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch follow status' },
      { status: 500 },
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.id || user.id.startsWith('guest')) {
      return NextResponse.json(
        {
          success: false,
          requiresLogin: true,
          message: 'Please login to follow this boutique',
        },
        { status: 401 },
      );
    }

    const { slug } = await params;
    const cleanSlug = (slug || '').toLowerCase().trim();

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [{ slug: cleanSlug }, { id: cleanSlug }],
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!shop) {
      return NextResponse.json({ success: false, message: 'Shop not found' }, { status: 404 });
    }

    const result = await ShopFollowService.toggleFollow(user.id, shop.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: result.isFollowing
        ? 'Now following boutique! You will see their new arrivals and boutique updates first.'
        : 'Unfollowed boutique',
    });
  } catch (error: any) {
    console.error('[SHOP_FOLLOW_POST_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update follow status' },
      { status: 500 },
    );
  }
}

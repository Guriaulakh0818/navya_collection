import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { SellerAnalyticsService } from '@/backend/services/seller-analytics.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/seller/analytics
 * Returns performance analytics for logged in seller store.
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'weekly' | 'monthly' | 'yearly') || 'monthly';
    const shopIdParam = searchParams.get('shopId');

    let targetShopId: string | null = null;

    if (isAdmin && shopIdParam) {
      targetShopId = shopIdParam;
    } else {
      const shop = await prisma.shop.findFirst({
        where: { ownerId: currentUser.id, deletedAt: null },
        select: { id: true },
      });
      targetShopId = shop?.id || null;
    }

    if (!targetShopId) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 404 },
      );
    }

    const analytics = await SellerAnalyticsService.getSellerAnalytics({
      shopId: targetShopId,
      period,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error: any) {
    console.error('❌ GET Seller Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch seller analytics.' },
      { status: 500 },
    );
  }
}

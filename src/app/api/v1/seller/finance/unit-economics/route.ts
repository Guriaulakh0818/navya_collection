import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { ContributionService } from '@/backend/services/contribution.service';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/seller/finance/unit-economics
 *
 * Seller-scoped unit economics and commission deduction overview.
 * Strict seller isolation: Scoped strictly to the seller's verified active shop.
 * Protected: Requires SELLER role.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Please login.' },
        { status: 401 },
      );
    }

    if (user.role?.toUpperCase() !== 'SELLER') {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Seller credentials required.' },
        { status: 403 },
      );
    }

    // Resolve seller's verified shop
    const shop = await prisma.shop.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No registered shop found for this seller account.' },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    const report = await ContributionService.getPeriodicContributionReport({
      startDate,
      endDate,
      shopId: shop.id,
      paymentMethod,
      limit,
      offset,
    });

    // Strip internal platform-wide confidential fields before returning to merchant
    const sellerSanitizedOrders = report.orders.map((ord: any) => ({
      orderId: ord.orderId,
      orderNumber: ord.orderNumber,
      orderStatus: ord.orderStatus,
      paymentMethod: ord.paymentMethod,
      calculatedAt: ord.calculatedAt,
      sellerBreakdown: ord.sellers.filter((s: any) => s.shopId === shop.id),
    }));

    return NextResponse.json({
      success: true,
      shop: { id: shop.id, name: shop.name },
      period: report.period,
      summary: report.summary,
      orders: sellerSanitizedOrders,
    });
  } catch (error: any) {
    console.error('[API_SELLER_UNIT_ECONOMICS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to retrieve seller unit economics.' },
      { status: 500 },
    );
  }
}

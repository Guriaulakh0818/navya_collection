import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { ContributionService } from '@/backend/services/contribution.service';

/**
 * GET /api/v1/admin/finance/unit-economics
 *
 * Comprehensive Admin Unit Economics & Navya Contribution API.
 * Supports order-level, seller-level, shipment-level, and periodic time-series aggregation.
 * Protected: Requires ADMIN, SUPER_ADMIN, OWNER, or SUPERVISOR role.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials required.' },
        { status: admin ? 403 : 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const vendorOrderId = searchParams.get('vendorOrderId');
    const shipmentId = searchParams.get('shipmentId');
    const orderItemId = searchParams.get('orderItemId');

    // 1. Single Item Contribution
    if (orderItemId) {
      const breakdown = await ContributionService.calculateItemContribution(orderItemId);
      return NextResponse.json({ success: true, data: breakdown });
    }

    // 2. Single Shipment Contribution
    if (shipmentId) {
      const breakdown = await ContributionService.calculateShipmentContribution(shipmentId);
      return NextResponse.json({ success: true, data: breakdown });
    }

    // 3. Single Seller Contribution
    if (vendorOrderId) {
      const breakdown = await ContributionService.calculateSellerContribution(vendorOrderId);
      return NextResponse.json({ success: true, data: breakdown });
    }

    // 4. Single Order Contribution
    if (orderId) {
      const breakdown = await ContributionService.calculateOrderContribution(orderId);
      return NextResponse.json({ success: true, data: breakdown });
    }

    // 5. Periodic & Filtered Aggregate Reporting
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const shopId = searchParams.get('shopId') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const groupBy = (searchParams.get('groupBy') as any) || 'day';
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 50;
    const offset = searchParams.get('offset') ? Number(searchParams.get('offset')) : 0;

    const report = await ContributionService.getPeriodicContributionReport({
      startDate,
      endDate,
      shopId,
      paymentMethod,
      groupBy,
      limit,
      offset,
    });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('[API_ADMIN_UNIT_ECONOMICS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to calculate unit economics report.' },
      { status: 500 },
    );
  }
}

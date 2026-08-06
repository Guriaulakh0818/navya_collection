import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Aggregate All Vendor Orders
    const vendorOrders = await prisma.vendorOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            city: true,
            sellerProfile: { select: { legalName: true, gstin: true } },
          },
        },
        masterOrder: {
          select: {
            orderNumber: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
    });

    // 2. Compute Overall Financial Metrics
    let totalGrossGMV = 0;
    let totalCommissionRevenue = 0;
    let totalNetVendorPayouts = 0;

    vendorOrders.forEach((vo) => {
      totalGrossGMV += Number(vo.totalAmount || 0);
      totalCommissionRevenue += Number(vo.commissionAmount || 0);
      totalNetVendorPayouts += Number(vo.vendorPayoutAmount || 0);
    });

    // 3. Group Metrics By Vendor Shop
    const shopMetricsMap = new Map<string, any>();

    vendorOrders.forEach((vo) => {
      const shopId = vo.shopId || 'unknown';
      const shopName = vo.shop?.name || 'Unassigned Boutique';
      const shopSlug = vo.shop?.slug || 'unknown';

      if (!shopMetricsMap.has(shopId)) {
        shopMetricsMap.set(shopId, {
          shopId,
          shopName,
          shopSlug,
          shopLogo: vo.shop?.logo,
          orderCount: 0,
          grossGMV: 0,
          commissionEarned: 0,
          netPayout: 0,
          status: 'SETTLED_UP_TO_DATE',
        });
      }

      const entry = shopMetricsMap.get(shopId)!;
      entry.orderCount += 1;
      entry.grossGMV += Number(vo.totalAmount || 0);
      entry.commissionEarned += Number(vo.commissionAmount || 0);
      entry.netPayout += Number(vo.vendorPayoutAmount || 0);
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalGrossGMV,
          totalCommissionRevenue,
          totalNetVendorPayouts,
          totalVendorOrders: vendorOrders.length,
          effectiveCommissionRate: '10% + ₹15 Flat Fee',
        },
        shops: Array.from(shopMetricsMap.values()),
        orders: vendorOrders,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Commission Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load commission financial report.' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    let targetShopId = shopId;
    if (!targetShopId) {
      const firstShop = await prisma.shop.findFirst({
        where: { status: 'APPROVED', deletedAt: null },
        select: { id: true },
      });
      targetShopId = firstShop?.id || null;
    }

    if (!targetShopId) {
      return NextResponse.json(
        { success: false, message: 'Seller shop not found.' },
        { status: 400 },
      );
    }

    // 1. Fetch Vendor Orders for Shop
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: { shopId: targetShopId },
      orderBy: { createdAt: 'desc' },
      include: {
        masterOrder: {
          select: {
            orderNumber: true,
            paymentStatus: true,
            paymentMethod: true,
            createdAt: true,
          },
        },
      },
    });

    // 2. Fetch Payout History
    const payouts = await prisma.vendorPayout.findMany({
      where: { shopId: targetShopId },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Compute Summary Totals
    let grossEarnings = 0;
    let totalCommissionDeducted = 0;
    let netPayoutBalance = 0;

    vendorOrders.forEach((vo) => {
      grossEarnings += Number(vo.totalAmount || 0);
      totalCommissionDeducted += Number(vo.commissionAmount || 0);
      netPayoutBalance += Number(vo.vendorPayoutAmount || 0);
    });

    let totalSettled = 0;
    payouts.forEach((p) => {
      if (p.status === 'PAID') {
        totalSettled += Number(p.amount || 0);
      }
    });

    const pendingPayout = Math.max(0, netPayoutBalance - totalSettled);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          grossEarnings,
          totalCommissionDeducted,
          netPayoutBalance,
          totalSettled,
          pendingPayout,
          commissionStructure: '10% Platform Fee + ₹15 Flat Fee',
        },
        orders: vendorOrders,
        payouts,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Seller Payout Ledger Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load seller payout ledger.' },
      { status: 500 },
    );
  }
}

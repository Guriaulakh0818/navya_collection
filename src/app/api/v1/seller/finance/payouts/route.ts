import { NextRequest, NextResponse } from 'next/server';

import { CommissionService } from '@/backend/services/commission.service';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // 1. Fetch Vendor Orders for Shop with Settlement & Items
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
        settlement: true,
        items: true,
      },
    });

    // 2. Fetch Payout History
    const payouts = await prisma.vendorPayout.findMany({
      where: { shopId: targetShopId },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Compute Authoritative BM-03 Financial Totals
    let totalSellingPrice = 0;
    let totalMrp = 0;
    let totalCommission = 0;
    let totalSellerBasePayout = 0;
    let totalSellerGstAmount = 0;
    let totalSellerPayout = 0;
    let totalShippingDeductions = 0;
    let totalReturnDeductions = 0;
    let totalAdjustments = 0;
    let netSettlementAmount = 0;

    vendorOrders.forEach((vo) => {
      const sp = Number(vo.totalAmount || 0);
      const mrp = Number(vo.totalMrp || vo.totalAmount || 0);
      const comm = Number(vo.commissionAmount || 0);
      const basePayout = Number(vo.sellerBasePayout ?? Math.max(0, sp - comm));
      const gst = Number(vo.sellerGstAmount || 0);
      const totalPayout = Number(vo.vendorPayoutAmount || basePayout + gst);

      totalSellingPrice += sp;
      totalMrp += mrp;
      totalCommission += comm;
      totalSellerBasePayout += basePayout;
      totalSellerGstAmount += gst;
      totalSellerPayout += totalPayout;

      if (vo.settlement) {
        totalShippingDeductions += Number(vo.settlement.returnShippingDeduction || 0);
        totalReturnDeductions += Number(vo.settlement.refundedProductValue || 0);
        totalAdjustments += Number(vo.settlement.adjustments || 0);
        netSettlementAmount += Number(vo.settlement.netSettlementAmount || 0);
      } else {
        netSettlementAmount += totalPayout;
      }
    });

    let totalSettled = 0;
    payouts.forEach((p) => {
      if (p.status === 'PAID') {
        totalSettled += Number(p.amount || 0);
      }
    });

    const pendingPayout = Math.max(0, netSettlementAmount - totalSettled);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalMrp: CommissionService.roundMoney(totalMrp),
          sellingPrice: CommissionService.roundMoney(totalSellingPrice),
          grossEarnings: CommissionService.roundMoney(totalSellingPrice),
          commissionBaseAmount: CommissionService.roundMoney(totalMrp),
          commissionRate: 10.0,
          commissionAmount: CommissionService.roundMoney(totalCommission),
          sellerBasePayout: CommissionService.roundMoney(totalSellerBasePayout),
          sellerGstAmount: CommissionService.roundMoney(totalSellerGstAmount),
          sellerTotalPayout: CommissionService.roundMoney(totalSellerPayout),
          shippingDeductions: CommissionService.roundMoney(totalShippingDeductions),
          returnDeductions: CommissionService.roundMoney(totalReturnDeductions),
          adjustments: CommissionService.roundMoney(totalAdjustments),
          netSettlementAmount: CommissionService.roundMoney(netSettlementAmount),
          totalSettled: CommissionService.roundMoney(totalSettled),
          pendingPayout: CommissionService.roundMoney(pendingPayout),
          commissionStructure:
            'Navya Commission = MRP × 10% | Seller Base Payout = Selling Price − Commission | GST added if registered',
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

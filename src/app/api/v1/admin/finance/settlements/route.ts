import { SettlementStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/finance/settlements
 * Returns:
 * 1. Granular SellerSettlement records with 10% commission, delivery+7d eligibility, return shipping liability (Section 2, 7, 11, 15).
 * 2. Summary aggregates (Pending, Eligible, On Hold, Settled).
 * 3. Shop balances with bank accounts + historical VendorPayout records.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const settlementStatusFilter = searchParams.get('settlementStatus');
    const shopFilter = searchParams.get('shopId');
    const search = searchParams.get('search');

    // 1. Fetch Granular Seller Settlements (Section 2, 11, 15)
    const settlementWhere: any = {};
    if (settlementStatusFilter && settlementStatusFilter !== 'ALL') {
      settlementWhere.status = settlementStatusFilter as SettlementStatus;
    }
    if (shopFilter && shopFilter !== 'ALL') {
      settlementWhere.shopId = shopFilter;
    }
    if (search) {
      settlementWhere.OR = [
        { settlementNumber: { contains: search, mode: 'insensitive' } },
        {
          vendorOrder: { masterOrder: { orderNumber: { contains: search, mode: 'insensitive' } } },
        },
        { vendorOrder: { vendorOrderNumber: { contains: search, mode: 'insensitive' } } },
        { shop: { name: { contains: search, mode: 'insensitive' } } },
        { shop: { owner: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [
      sellerSettlements,
      totalSettlementsCount,
      allSettlementAggregates,
      shops,
      historicalPayouts,
      pendingDebitsList,
    ] = await Promise.all([
      prisma.sellerSettlement
        .findMany({
          where: settlementWhere,
          include: {
            shop: {
              select: {
                id: true,
                name: true,
                bankName: true,
                bankAccountNumber: true,
                bankIfscCode: true,
                owner: {
                  select: { id: true, name: true, email: true, mobile: true },
                },
              },
            },
            vendorOrder: {
              select: {
                id: true,
                vendorOrderNumber: true,
                status: true,
                masterOrder: {
                  select: {
                    id: true,
                    orderNumber: true,
                    orderStatus: true,
                    createdAt: true,
                    returnRequests: {
                      select: {
                        id: true,
                        requestNumber: true,
                        status: true,
                        type: true,
                        returnShippingDeduction: true,
                      },
                    },
                  },
                },
              },
            },
            adjustmentsList: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
        .catch(() => []),
      prisma.sellerSettlement.count({ where: settlementWhere }).catch(() => 0),
      prisma.sellerSettlement
        .groupBy({
          by: ['status'],
          _sum: {
            grossProductValue: true,
            commissionAmount: true,
            returnShippingDeduction: true,
            netSettlementAmount: true,
          },
          _count: {
            id: true,
          },
        })
        .catch(() => []),
      prisma.shop
        .findMany({
          where: { status: 'APPROVED', deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            phone: true,
            email: true,
            gstin: true,
            bankAccountHolder: true,
            bankAccountNumber: true,
            bankIfscCode: true,
            bankName: true,
            vendorOrders: {
              select: {
                id: true,
                totalAmount: true,
                commissionAmount: true,
                vendorPayoutAmount: true,
                status: true,
                createdAt: true,
              },
            },
          },
        })
        .catch(() => []),
      prisma.vendorPayout
        .findMany({
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            shop: {
              select: {
                name: true,
                slug: true,
                logo: true,
                bankName: true,
                bankAccountNumber: true,
                bankIfscCode: true,
              },
            },
          },
        })
        .catch(() => []),
      prisma.sellerAdjustment
        .findMany({
          where: { type: 'DEBIT', status: 'PENDING' },
          take: 50,
        })
        .catch(() => []),
    ]);

    // Compute Summary Status Metrics
    let totalPendingSettlement = 0;
    let totalEligibleSettlement = 0;
    let totalOnHoldSettlement = 0;
    let totalSettled = 0;
    let totalReturnShippingDeductions = 0;

    allSettlementAggregates.forEach((agg) => {
      const net = Number(agg._sum.netSettlementAmount || 0);
      const deductions = Number(agg._sum.returnShippingDeduction || 0);
      totalReturnShippingDeductions += deductions;

      if (agg.status === 'PENDING_SETTLEMENT') totalPendingSettlement += net;
      if (agg.status === 'ELIGIBLE_FOR_SETTLEMENT') totalEligibleSettlement += net;
      if (agg.status === 'ON_HOLD') totalOnHoldSettlement += net;
      if (agg.status === 'SETTLED') totalSettled += net;
    });

    // Compute Pending Balances per Shop for payout modal
    const pendingBalances = shops.map((shop: any) => {
      let totalGrossGMV = 0;
      let totalCommissionDeducted = 0;
      let netVendorEarnings = 0;

      shop.vendorOrders.forEach((vo: any) => {
        totalGrossGMV += Number(vo.totalAmount || 0);
        totalCommissionDeducted += Number(vo.commissionAmount || 0);
        netVendorEarnings += Number(vo.vendorPayoutAmount || 0);
      });

      const paidPayouts = historicalPayouts.filter(
        (p) => p.shopId === shop.id && p.status === 'PAID',
      );
      const totalPaidAmount = paidPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const shopPendingDebits = pendingDebitsList.filter((d: any) => d.shopId === shop.id);
      const outstandingDebitBalance = shopPendingDebits.reduce(
        (sum: number, d: any) =>
          sum + Math.max(0, Number(d.amount) - Number(d.recoveredAmount || 0)),
        0,
      );
      const pendingAmount = Math.max(
        0,
        netVendorEarnings - totalPaidAmount - outstandingDebitBalance,
      );

      return {
        shopId: shop.id,
        shopName: shop.name,
        shopSlug: shop.slug,
        shopLogo: shop.logo,
        bankAccountHolder: shop.bankAccountHolder,
        bankAccountNumber: shop.bankAccountNumber,
        bankIfscCode: shop.bankIfscCode,
        bankName: shop.bankName,
        totalOrdersCount: shop.vendorOrders.length,
        totalGrossGMV,
        totalCommissionDeducted,
        netVendorEarnings,
        totalPaidAmount,
        outstandingDebitBalance,
        pendingAmount,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPendingSettlement,
          totalEligibleSettlement,
          totalOnHoldSettlement,
          totalSettled,
          totalReturnShippingDeductions,
          totalSettlementsCount,
        },
        sellerSettlements,
        pendingBalances,
        payoutHistory: historicalPayouts,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Settlements Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load seller settlements data.' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/admin/finance/settlements
 * Process manual seller payout disbursement action and mark related settlements as SETTLED.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin credentials required.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { shopId, amount, referenceNumber, periodStart, periodEnd, notes, paymentMethod } = body;

    if (!shopId || !amount || !referenceNumber) {
      return NextResponse.json(
        { success: false, message: 'Shop ID, amount, and UTR reference number are required.' },
        { status: 400 },
      );
    }

    const payoutAmount = parseFloat(amount);
    if (isNaN(payoutAmount) || payoutAmount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid payout amount.' },
        { status: 400 },
      );
    }

    const pStart = periodStart
      ? new Date(periodStart)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pEnd = periodEnd ? new Date(periodEnd) : new Date();

    const payout = await prisma.$transaction(async (tx) => {
      // 1. Create VendorPayout Record
      const createdPayout = await tx.vendorPayout.create({
        data: {
          shopId,
          amount: payoutAmount,
          status: 'PAID',
          referenceNumber,
          periodStart: pStart,
          periodEnd: pEnd,
          paidAt: new Date(),
          notes: notes
            ? `${notes} (Via ${paymentMethod || 'Bank Transfer'})`
            : `Paid via ${paymentMethod || 'Bank Transfer'} UTR: ${referenceNumber}`,
        },
      });

      // 2. Mark eligible settlements for this shop as SETTLED (Section 2, 22)
      await tx.sellerSettlement.updateMany({
        where: {
          shopId,
          status: 'ELIGIBLE_FOR_SETTLEMENT',
        },
        data: {
          status: 'SETTLED',
          settledAt: new Date(),
          vendorPayoutId: createdPayout.id,
          notes: `Settled via UTR ${referenceNumber}`,
        },
      });

      // 3. Log Financial Audit Trail (Section 23)
      await tx.financialAuditLog.create({
        data: {
          entityType: 'PAYOUT',
          entityId: createdPayout.id,
          action: 'PAYOUT_DISBURSED',
          performedById: admin.id,
          amount: payoutAmount,
          notes: `Payout disbursed to shop ${shopId} with reference ${referenceNumber}`,
          newValues: { shopId, referenceNumber, paymentMethod },
        },
      });

      return createdPayout;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed payout of ₹${payoutAmount.toLocaleString('en-IN')} with UTR ${referenceNumber}.`,
      data: payout,
    });
  } catch (error: any) {
    console.error('❌ POST Process Seller Settlement Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process seller payout.' },
      { status: 500 },
    );
  }
}

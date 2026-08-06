import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/finance/settlements
 * Returns pending shop balances with bank account details + historical VendorPayout records.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // 1. Fetch All Approved Vendor Shops with Bank Account Details
    const shops = await prisma.shop.findMany({
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
    });

    // 2. Fetch Historical Vendor Payouts
    const payoutWhere: any = {};
    if (status && status !== 'ALL') {
      payoutWhere.status = status;
    }

    const historicalPayouts = await prisma.vendorPayout.findMany({
      where: payoutWhere,
      orderBy: { createdAt: 'desc' },
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
    });

    // 3. Compute Pending Balances per Shop
    const pendingBalances = shops.map((shop: any) => {
      let totalGrossGMV = 0;
      let totalCommissionDeducted = 0;
      let netVendorEarnings = 0;

      shop.vendorOrders.forEach((vo: any) => {
        totalGrossGMV += Number(vo.totalAmount || 0);
        totalCommissionDeducted += Number(vo.commissionAmount || 0);
        netVendorEarnings += Number(vo.vendorPayoutAmount || 0);
      });

      // Sum already paid payouts
      const paidPayouts = historicalPayouts.filter(
        (p) => p.shopId === shop.id && p.status === 'PAID',
      );
      const totalPaidAmount = paidPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingAmount = Math.max(0, netVendorEarnings - totalPaidAmount);

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
        pendingAmount,
      };
    });

    // Summary Totals
    const totalPendingDisbursals = pendingBalances.reduce((sum, b) => sum + b.pendingAmount, 0);
    const totalDisbursedToDate = historicalPayouts
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPendingDisbursals,
          totalDisbursedToDate,
          pendingShopsCount: pendingBalances.filter((b) => b.pendingAmount > 0).length,
        },
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
 * Process manual seller payout disburse action.
 */
export async function POST(request: NextRequest) {
  try {
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

    // Create VendorPayout Record
    const payout = await prisma.vendorPayout.create({
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

    return NextResponse.json({
      success: true,
      message: `Successfully processed payout of ₹${payoutAmount.toLocaleString('en-IN')} with UTR ${referenceNumber}.`,
      data: payout,
    });
  } catch (error: any) {
    console.error('❌ POST Process Seller Settlement Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to process manual seller payout.' },
      { status: 500 },
    );
  }
}

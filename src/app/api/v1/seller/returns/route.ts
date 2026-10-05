import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

function maskAccountNumber(acc: string | null | undefined): string | null {
  if (!acc) return null;
  const cleaned = acc.trim();
  if (cleaned.length <= 4) return '••••' + cleaned;
  return '••••••••' + cleaned.slice(-4);
}

/**
 * GET /api/v1/seller/returns
 * Fetches returns and replacement requests belonging strictly to the authenticated seller's shop (BM-08 Section 23).
 * Sellers can view returns, tracking details, and items, but cannot access other sellers' data or trigger refunds.
 * Customer bank account numbers are safely masked.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please log in.' },
        { status: 401 },
      );
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(user.role);
    const { searchParams } = new URL(request.url);
    const shopIdParam = searchParams.get('shopId');
    const status = searchParams.get('status');
    const query = (searchParams.get('q') || '').trim();

    let targetShopId: string | null = null;

    if (isAdmin && shopIdParam) {
      targetShopId = shopIdParam;
    } else {
      const shop = await prisma.shop.findFirst({
        where: { ownerId: user.id, deletedAt: null },
        select: { id: true },
      });
      targetShopId = shop?.id || null;
    }

    if (!targetShopId) {
      return NextResponse.json(
        { success: false, message: 'No active seller shop associated with your account.' },
        { status: 403 },
      );
    }

    const where: any = {
      OR: [{ shopId: targetShopId }, { vendorOrder: { shopId: targetShopId } }],
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (query) {
      where.AND = [
        {
          OR: [
            { requestNumber: { contains: query, mode: 'insensitive' } },
            { order: { orderNumber: { contains: query, mode: 'insensitive' } } },
            { reverseAwbCode: { contains: query, mode: 'insensitive' } },
            { items: { some: { orderItem: { name: { contains: query, mode: 'insensitive' } } } } },
          ],
        },
      ];
    }

    const returnRequests = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            createdAt: true,
            paymentMethod: true,
          },
        },
        items: {
          include: {
            orderItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                quantity: true,
                total: true,
              },
            },
          },
        },
        customerRefund: {
          select: {
            id: true,
            refundNumber: true,
            amount: true,
            status: true,
            refundMethod: true,
            createdAt: true,
          },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            previousStatus: true,
            newStatus: true,
            reason: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask sensitive details
    const safeReturns = returnRequests.map((ret) => ({
      ...ret,
      bankAccountNumber: maskAccountNumber(ret.bankAccountNumber),
    }));

    return NextResponse.json({
      success: true,
      data: safeReturns,
    });
  } catch (error: any) {
    console.error('❌ GET Seller Returns Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch seller returns.' },
      { status: 500 },
    );
  }
}

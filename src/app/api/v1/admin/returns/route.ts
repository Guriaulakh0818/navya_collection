import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/returns
 * Fetches all Return and Replacement requests across the marketplace with filters.
 * (Section 5: NAVYA ADMIN RETURN/REPLACEMENT APPROVAL)
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
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const typeFilter = searchParams.get('type') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (typeFilter !== 'ALL') {
      where.type = typeFilter;
    }

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { mobile: { contains: search, mode: 'insensitive' } } },
        { shop: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [totalCount, requests] = await Promise.all([
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              orderStatus: true,
              paymentStatus: true,
              createdAt: true,
              shipments: {
                select: {
                  id: true,
                  awbCode: true,
                  courierName: true,
                  status: true,
                  actualForwardShippingCost: true,
                  actualReverseShippingCost: true,
                  returnShippingDeduction: true,
                  deliveredAt: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              mobile: true,
            },
          },
          shop: {
            select: {
              id: true,
              name: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  mobile: true,
                },
              },
            },
          },
          vendorOrder: {
            select: {
              id: true,
              vendorOrderNumber: true,
              totalAmount: true,
              settlement: {
                select: {
                  id: true,
                  settlementNumber: true,
                  status: true,
                  grossProductValue: true,
                  commissionAmount: true,
                  returnShippingDeduction: true,
                  netSettlementAmount: true,
                  settlementEligibilityDate: true,
                },
              },
            },
          },
          items: {
            include: {
              orderItem: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  quantity: true,
                  total: true,
                  policyType: true,
                  returnAllowed: true,
                  returnWindowDays: true,
                  replacementAllowed: true,
                  replacementWindowDays: true,
                  deliveredAt: true,
                },
              },
            },
          },
          auditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              performedBy: {
                select: { id: true, name: true, role: true },
              },
            },
          },
          customerRefund: true,
          adjustments: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Gather packing proofs for orders in this list
    const orderIds = requests.map((r) => r.orderId).filter(Boolean);
    const packingProofs =
      orderIds.length > 0
        ? await prisma.sellerPackingProof.findMany({
            where: { orderId: { in: orderIds } },
            orderBy: { createdAt: 'desc' },
          })
        : [];

    const packingProofsByOrder = new Map<string, typeof packingProofs>();
    for (const proof of packingProofs) {
      const existing = packingProofsByOrder.get(proof.orderId) || [];
      existing.push(proof);
      packingProofsByOrder.set(proof.orderId, existing);
    }

    const enrichedRequests = requests.map((req) => ({
      ...req,
      sellerPackingProofs: packingProofsByOrder.get(req.orderId) || [],
    }));

    return NextResponse.json({
      success: true,
      data: enrichedRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Returns Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch return requests.' },
      { status: 500 },
    );
  }
}

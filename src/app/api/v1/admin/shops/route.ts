import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/shops
 * Returns total registered merchant shops metrics and full list of boutique stores.
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
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'ALL';

    const where: any = {};
    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalShops, approvedShops, pendingShops, suspendedShops, shopsList] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: 'APPROVED' } }),
      prisma.shop.count({
        where: { status: { in: ['PENDING_VERIFICATION', 'UNDER_REVIEW'] } },
      }),
      prisma.shop.count({ where: { status: 'SUSPENDED' } }),

      prisma.shop.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { name: true, email: true, mobile: true },
          },
          _count: {
            select: { products: true, orderItems: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalShops,
          approvedShops,
          pendingShops,
          suspendedShops,
        },
        shops: shopsList.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          status: s.status,
          commissionRate: Number(s.commissionRate || 10.0),
          verificationBadge: s.verificationBadge,
          productCount: s._count.products,
          ordersCount: s._count.orderItems,
          ownerName: s.owner?.name || 'Store Owner',
          ownerEmail: s.owner?.email || 'N/A',
          ownerMobile: s.owner?.mobile || 'N/A',
          createdAt: s.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Shops Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch shops.' },
      { status: 500 },
    );
  }
}

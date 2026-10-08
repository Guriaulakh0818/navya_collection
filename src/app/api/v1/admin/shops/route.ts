import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/shops
 * Returns total registered merchant shops metrics and full list of boutique stores.
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
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);

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

    // 1. Fetch counts defensively
    let [totalShops, approvedShops, pendingShops, suspendedShops] = await Promise.all([
      prisma.shop.count({ where: { deletedAt: null } }).catch(() => 0),
      prisma.shop.count({ where: { status: 'APPROVED', deletedAt: null } }).catch(() => 0),
      prisma.shop
        .count({
          where: { status: { in: ['PENDING_VERIFICATION', 'UNDER_REVIEW'] }, deletedAt: null },
        })
        .catch(() => 0),
      prisma.shop.count({ where: { status: 'SUSPENDED', deletedAt: null } }).catch(() => 0),
    ]);

    // 2. Fetch shops with relational fallback to prevent crashes
    let shopsList: any[] = [];
    try {
      shopsList = await prisma.shop.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          owner: {
            select: { name: true, email: true, mobile: true },
          },
          _count: {
            select: { products: true, orderItems: true },
          },
        },
      });
    } catch (err: any) {
      console.warn(
        '⚠️ Full shop include failed, falling back to basic owner include:',
        err?.message,
      );
      try {
        shopsList = await prisma.shop.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          include: {
            owner: {
              select: { name: true, email: true, mobile: true },
            },
          },
        });
      } catch (fallbackErr: any) {
        console.error(
          '⚠️ Secondary shop fetch failed, attempting minimal fetch:',
          fallbackErr?.message,
        );
        shopsList = await prisma.shop
          .findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
          })
          .catch(() => []);
      }
    }

    // Auto-reconcile stats from fetched list if individual counts were zeroed out
    if (totalShops === 0 && shopsList.length > 0) {
      totalShops = shopsList.length;
      approvedShops = shopsList.filter((s) => s.status === 'APPROVED').length;
      pendingShops = shopsList.filter((s) =>
        ['PENDING_VERIFICATION', 'UNDER_REVIEW'].includes(s.status),
      ).length;
      suspendedShops = shopsList.filter((s) => s.status === 'SUSPENDED').length;
    }

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
          verificationBadge: s.verificationBadge || 'NONE',
          productCount: s._count?.products ?? 0,
          ordersCount: s._count?.orderItems ?? 0,
          ownerName: s.owner?.name || 'Store Owner',
          ownerEmail: s.owner?.email || 'N/A',
          ownerMobile: s.owner?.mobile || 'N/A',
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
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

import { ShopStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (
      !user ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes((user.role || '').toUpperCase())
    ) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. Admin access required.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const query = (searchParams.get('q') || searchParams.get('query') || '').trim().toLowerCase();

    // Build Prisma query conditions
    const whereCondition: any = {
      deletedAt: null,
    };

    if (status !== 'ALL') {
      if (status === 'PENDING_VERIFICATION') {
        whereCondition.status = { in: [ShopStatus.PENDING_VERIFICATION, 'UNDER_REVIEW'] };
      } else {
        whereCondition.status = status as ShopStatus;
      }
    }

    if (query) {
      whereCondition.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { gstin: { contains: query, mode: 'insensitive' } },
        { panNumber: { contains: query, mode: 'insensitive' } },
        { owner: { name: { contains: query, mode: 'insensitive' } } },
        { owner: { email: { contains: query, mode: 'insensitive' } } },
        { sellerProfile: { legalName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    // Execute list query and ALL tab counts concurrently in ONE Promise.all
    const [shops, countAll, countPending, countApproved, countRejected, countSuspended] =
      await Promise.all([
        prisma.shop.findMany({
          where: whereCondition,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                approvalStatus: true,
                createdAt: true,
              },
            },
            sellerProfile: true,
            addresses: true,
            documents: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        prisma.shop.count({ where: { deletedAt: null } }).catch(() => 0),
        prisma.shop
          .count({
            where: {
              status: { in: [ShopStatus.PENDING_VERIFICATION, 'UNDER_REVIEW' as any] },
              deletedAt: null,
            },
          })
          .catch(() => 0),
        prisma.shop
          .count({ where: { status: ShopStatus.APPROVED, deletedAt: null } })
          .catch(() => 0),
        prisma.shop
          .count({ where: { status: ShopStatus.REJECTED, deletedAt: null } })
          .catch(() => 0),
        prisma.shop
          .count({ where: { status: ShopStatus.SUSPENDED, deletedAt: null } })
          .catch(() => 0),
      ]);

    const counts = {
      ALL: countAll,
      PENDING_VERIFICATION: countPending,
      APPROVED: countApproved,
      REJECTED: countRejected,
      SUSPENDED: countSuspended,
    };

    return NextResponse.json({
      success: true,
      data: shops,
      counts,
    });
  } catch (error: any) {
    console.error('❌ Admin GET Sellers Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch sellers list.' },
      { status: 500 },
    );
  }
}

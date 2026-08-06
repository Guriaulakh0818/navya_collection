import { ShopStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
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
      whereCondition.status = status as ShopStatus;
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

    const shops = await prisma.shop.findMany({
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
    });

    // Counts for status tabs
    const counts = {
      ALL: await prisma.shop.count({ where: { deletedAt: null } }),
      PENDING_VERIFICATION: await prisma.shop.count({
        where: { status: ShopStatus.PENDING_VERIFICATION, deletedAt: null },
      }),
      APPROVED: await prisma.shop.count({
        where: { status: ShopStatus.APPROVED, deletedAt: null },
      }),
      REJECTED: await prisma.shop.count({
        where: { status: ShopStatus.REJECTED, deletedAt: null },
      }),
      SUSPENDED: await prisma.shop.count({
        where: { status: ShopStatus.SUSPENDED, deletedAt: null },
      }),
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

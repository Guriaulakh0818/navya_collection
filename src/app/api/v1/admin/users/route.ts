import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/users
 * Returns total registered users metrics and full list of registered users.
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
    const roleFilter = searchParams.get('role') || 'ALL';

    const where: any = {};
    if (roleFilter !== 'ALL') {
      where.role = roleFilter;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalUsers, customerCount, sellerCount, adminCount, usersList] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ['USER', 'CUSTOMER'] } } }),
      prisma.user.count({ where: { role: 'SELLER' } }),
      prisma.user.count({
        where: { role: { in: ['ADMIN', 'OWNER', 'SUPER_ADMIN', 'SUPERVISOR'] } },
      }),

      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          role: true,
          approvalStatus: true,
          createdAt: true,
          ownedShops: {
            select: { id: true, name: true, status: true },
            take: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          customerCount,
          sellerCount,
          adminCount,
        },
        users: usersList.map((u) => ({
          id: u.id,
          name: u.name || 'Registered User',
          email: u.email || 'N/A',
          mobile: u.mobile || 'N/A',
          role: u.role,
          status: u.approvalStatus || 'APPROVED',
          shopName: u.ownedShops[0]?.name || null,
          createdAt: u.createdAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Users Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch users.' },
      { status: 500 },
    );
  }
}

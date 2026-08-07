import { NextRequest, NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/admin/analytics
 * Returns registration & onboarding growth progress for Users and Shops.
 * Query params: ?period=hourly | daily | weekly
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
    const period = searchParams.get('period') || 'daily'; // 'hourly' | 'daily' | 'weekly'

    const now = new Date();

    // 1. Fetch Users & Shops created recently for trend analysis
    let startDate = new Date();
    if (period === 'hourly') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Past 24 hours
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000); // Past 8 weeks
    } else {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Past 7 days (Daily)
    }

    const [userRecords, shopRecords, totalUsersCount, totalShopsCount] = await Promise.all([
      prisma.user.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, role: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.shop.findMany({
        where: { createdAt: { gte: startDate } },
        select: { id: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.user.count(),
      prisma.shop.count(),
    ]);

    // Grouping helper based on period (Hourly, Daily, Weekly)
    const userMap: Record<string, number> = {};
    const shopMap: Record<string, number> = {};

    if (period === 'hourly') {
      // 24 slots (00:00 to 23:00)
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const label = `${String(d.getHours()).padStart(2, '0')}:00`;
        userMap[label] = 0;
        shopMap[label] = 0;
      }
      userRecords.forEach((u) => {
        const label = `${String(u.createdAt.getHours()).padStart(2, '0')}:00`;
        if (userMap[label] !== undefined) userMap[label]++;
      });
      shopRecords.forEach((s) => {
        const label = `${String(s.createdAt.getHours()).padStart(2, '0')}:00`;
        if (shopMap[label] !== undefined) shopMap[label]++;
      });
    } else if (period === 'weekly') {
      // Past 8 weeks
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const label = `Wk ${Math.ceil((d.getDate() + 1) / 7)} (${d.toLocaleDateString('en-IN', { month: 'short' })})`;
        userMap[label] = 0;
        shopMap[label] = 0;
      }
      userRecords.forEach((u) => {
        const label = `Wk ${Math.ceil((u.createdAt.getDate() + 1) / 7)} (${u.createdAt.toLocaleDateString('en-IN', { month: 'short' })})`;
        userMap[label] = (userMap[label] || 0) + 1;
      });
      shopRecords.forEach((s) => {
        const label = `Wk ${Math.ceil((s.createdAt.getDate() + 1) / 7)} (${s.createdAt.toLocaleDateString('en-IN', { month: 'short' })})`;
        shopMap[label] = (shopMap[label] || 0) + 1;
      });
    } else {
      // Daily: Past 7 Days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        userMap[label] = 0;
        shopMap[label] = 0;
      }
      userRecords.forEach((u) => {
        const label = u.createdAt.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        if (userMap[label] !== undefined) userMap[label]++;
      });
      shopRecords.forEach((s) => {
        const label = s.createdAt.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        if (shopMap[label] !== undefined) shopMap[label]++;
      });
    }

    const userChart = Object.entries(userMap).map(([label, count]) => ({ label, count }));
    const shopChart = Object.entries(shopMap).map(([label, count]) => ({ label, count }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        totals: {
          totalUsers: totalUsersCount,
          totalShops: totalShopsCount,
          newUsersInPeriod: userRecords.length,
          newShopsInPeriod: shopRecords.length,
        },
        userAnalytics: {
          chart: userChart,
          total: userRecords.length,
        },
        shopAnalytics: {
          chart: shopChart,
          total: shopRecords.length,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to compute growth analytics.' },
      { status: 500 },
    );
  }
}

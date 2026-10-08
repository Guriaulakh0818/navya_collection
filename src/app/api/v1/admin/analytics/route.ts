import { NextRequest, NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/admin/analytics
 * Returns registration & onboarding growth progress for Users and Shops.
 * Query params: ?period=hourly | daily | weekly
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes((admin.role || '').toUpperCase())
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
      prisma.user
        .findMany({
          where: { createdAt: { gte: startDate } },
          select: { id: true, role: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })
        .catch(() => []),
      prisma.shop
        .findMany({
          where: { createdAt: { gte: startDate } },
          select: { id: true, status: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })
        .catch(() => []),
      prisma.user.count().catch(() => 0),
      prisma.shop.count().catch(() => 0),
    ]);

    const slots: { key: string; label: string }[] = [];
    const userMap: Record<string, number> = {};
    const shopMap: Record<string, number> = {};

    if (period === 'hourly') {
      // 24 slots (00:00 to 23:00)
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hourStr = `${String(d.getHours()).padStart(2, '0')}:00`;
        slots.push({ key: hourStr, label: hourStr });
        userMap[hourStr] = 0;
        shopMap[hourStr] = 0;
      }
      (userRecords || []).forEach((u: any) => {
        const d = new Date(u.createdAt);
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (userMap[key] !== undefined) userMap[key]++;
      });
      (shopRecords || []).forEach((s: any) => {
        const d = new Date(s.createdAt);
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        if (shopMap[key] !== undefined) shopMap[key]++;
      });
    } else if (period === 'weekly') {
      // Past 8 weeks
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
        const label = `Wk ${Math.ceil(d.getDate() / 7)} (${d.toLocaleDateString('en-IN', { month: 'short' })})`;
        slots.push({ key: weekKey, label });
        userMap[weekKey] = 0;
        shopMap[weekKey] = 0;
      }
      (userRecords || []).forEach((u: any) => {
        const d = new Date(u.createdAt);
        const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
        if (userMap[weekKey] !== undefined) userMap[weekKey]++;
      });
      (shopRecords || []).forEach((s: any) => {
        const d = new Date(s.createdAt);
        const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
        if (shopMap[weekKey] !== undefined) shopMap[weekKey]++;
      });
    } else {
      // Daily: Past 7 Days with deterministic YYYY-MM-DD matching
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        slots.push({ key: dateKey, label });
        userMap[dateKey] = 0;
        shopMap[dateKey] = 0;
      }
      (userRecords || []).forEach((u: any) => {
        const dateKey = new Date(u.createdAt).toISOString().slice(0, 10);
        if (userMap[dateKey] !== undefined) userMap[dateKey]++;
      });
      (shopRecords || []).forEach((s: any) => {
        const dateKey = new Date(s.createdAt).toISOString().slice(0, 10);
        if (shopMap[dateKey] !== undefined) shopMap[dateKey]++;
      });
    }

    const userChart = slots.map((s) => ({ label: s.label, count: userMap[s.key] || 0 }));
    const shopChart = slots.map((s) => ({ label: s.label, count: shopMap[s.key] || 0 }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        totals: {
          totalUsers: Number(totalUsersCount || 0),
          totalShops: Number(totalShopsCount || 0),
          newUsersInPeriod: (userRecords || []).length,
          newShopsInPeriod: (shopRecords || []).length,
        },
        userAnalytics: {
          chart: userChart,
          total: (userRecords || []).length,
        },
        shopAnalytics: {
          chart: shopChart,
          total: (shopRecords || []).length,
        },
      },
    });
  } catch (error: any) {
    console.error('❌ GET Admin Analytics Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to compute growth analytics.' },
      { status: 500 },
    );
  }
}

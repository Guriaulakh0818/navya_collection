import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || !['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch live platform counts
    const [
      totalOrdersCount,
      activeShopsCount,
      pendingSellersCount,
      pendingProductsCount,
      totalCustomersCount,
      pendingSellersList,
      pendingProductsList,
      recentOrdersList,
      recentShopsList,
      ordersAgg,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.shop.count({ where: { status: 'APPROVED' } }),
      prisma.shop.count({ where: { status: { in: ['PENDING_VERIFICATION', 'UNDER_REVIEW'] } } }),
      prisma.product.count({ where: { status: 'draft' } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),

      // Pending seller onboarding applications
      prisma.shop.findMany({
        where: { status: { in: ['PENDING_VERIFICATION', 'UNDER_REVIEW'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { name: true, email: true, mobile: true },
          },
          addresses: { take: 1 },
        },
      }),

      // Pending products waiting for moderation
      prisma.product.findMany({
        where: { status: 'draft' },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          shop: { select: { name: true } },
          images: { take: 1 },
          category: { select: { name: true } },
        },
      }),

      // Recent orders feed
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            take: 1,
            include: {
              shop: { select: { name: true } },
            },
          },
        },
      }),

      // Recent shops
      prisma.shop.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { name: true } },
        },
      }),

      // Revenue aggregate
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    const totalRevenue = Number(ordersAgg._sum.totalAmount || 0);
    // Estimated 10% average commission earned
    const adminCommissionEarned = Math.round(totalRevenue * 0.1);
    const pendingPayoutsAmount = Math.round(totalRevenue * 0.9);

    const formattedPendingSellers = pendingSellersList.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      ownerName: s.owner?.name || 'Applicant',
      ownerEmail: s.owner?.email || 'N/A',
      ownerMobile: s.owner?.mobile || undefined,
      city: s.addresses[0]?.city || undefined,
    }));

    const formattedPendingProducts = pendingProductsList.map((p) => ({
      id: p.id,
      title: p.name,
      price: Number(p.price || 0),
      category: p.category?.name,
      shopName: p.shop?.name || 'Seller Boutique',
      createdAt: p.createdAt.toISOString(),
      imageUrl: p.images[0]?.imageUrl || undefined,
    }));

    const formattedRecentOrders = recentOrdersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || 'Customer',
      shopName: o.items[0]?.shop?.name || 'Navya Boutique',
      totalAmount: Number(o.totalAmount || 0),
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'PREPAID',
      createdAt: o.createdAt.toISOString(),
    }));

    const formattedRecentShops = recentShopsList.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      ownerName: s.owner?.name || 'Owner',
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          adminCommissionEarned,
          pendingSellersCount,
          pendingProductsCount,
          activeShopsCount,
          totalOrdersCount,
          totalCustomersCount,
          pendingPayoutsAmount,
        },
        pendingSellers: formattedPendingSellers,
        pendingProducts: formattedPendingProducts,
        recentOrders: formattedRecentOrders,
        recentShops: formattedRecentShops,
      },
    });
  } catch (error: any) {
    console.error('API Error in /api/v1/admin/dashboard/stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

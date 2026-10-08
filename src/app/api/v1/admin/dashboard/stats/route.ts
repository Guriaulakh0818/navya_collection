import { NextResponse } from 'next/server';

import { getAdminUser } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (
      !admin ||
      !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes((admin.role || '').toUpperCase())
    ) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch live platform counts defensively
    const [
      ordersCount,
      shopsCount,
      sellersCount,
      productsCount,
      customersCount,
      sellersList,
      productsList,
      ordersList,
      shopsList,
      ordersAgg,
      vendorOrdersAgg,
    ] = await Promise.all([
      prisma.order.count().catch(() => 0),
      prisma.shop.count({ where: { status: 'APPROVED' } }).catch(() => 0),
      prisma.shop
        .count({ where: { status: { in: ['PENDING_VERIFICATION', 'UNDER_REVIEW'] } } })
        .catch(() => 0),
      prisma.product.count({ where: { status: 'draft' } }).catch(() => 0),
      prisma.user.count({ where: { role: { in: ['USER', 'CUSTOMER'] } } }).catch(() => 0),

      // Pending seller onboarding applications
      prisma.shop
        .findMany({
          where: { status: { in: ['PENDING_VERIFICATION', 'UNDER_REVIEW'] } },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: {
              select: { name: true, email: true, mobile: true },
            },
            addresses: { take: 1 },
          },
        })
        .catch(() => []),

      // Pending products waiting for moderation
      prisma.product
        .findMany({
          where: { status: 'draft' },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            shop: { select: { name: true } },
            images: { take: 1 },
            category: { select: { name: true } },
          },
        })
        .catch(() => []),

      // Recent orders feed
      prisma.order
        .findMany({
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
        })
        .catch(() => []),

      // Recent shops
      prisma.shop
        .findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: { select: { name: true } },
          },
        })
        .catch(() => []),

      // Revenue aggregate
      prisma.order
        .aggregate({
          _sum: { totalAmount: true },
        })
        .catch(() => ({ _sum: { totalAmount: 0 } })),

      // Vendor orders aggregate for authoritative commission and payout
      prisma.vendorOrder
        .aggregate({
          _sum: { commissionAmount: true, vendorPayoutAmount: true },
        })
        .catch(() => ({ _sum: { commissionAmount: 0, vendorPayoutAmount: 0 } })),
    ]);

    const totalOrdersCount = Number(ordersCount || 0);
    const activeShopsCount = Number(shopsCount || 0);
    const pendingSellersCount = Number(sellersCount || 0);
    const pendingProductsCount = Number(productsCount || 0);
    const totalCustomersCount = Number(customersCount || 0);
    const pendingSellersList = sellersList || [];
    const pendingProductsList = productsList || [];
    const recentOrdersList = ordersList || [];
    const recentShopsList = shopsList || [];
    const totalRevenue = Number(ordersAgg?._sum?.totalAmount || 0);
    const adminCommissionEarned = Number(vendorOrdersAgg?._sum?.commissionAmount || 0);
    const pendingPayoutsAmount = Number(vendorOrdersAgg?._sum?.vendorPayoutAmount || 0);

    const formattedPendingSellers = pendingSellersList.map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      ownerName: s.owner?.name || 'Applicant',
      ownerEmail: s.owner?.email || 'N/A',
      ownerMobile: s.owner?.mobile || undefined,
      city: s.addresses?.[0]?.city || undefined,
    }));

    const formattedPendingProducts = pendingProductsList.map((p: any) => ({
      id: p.id,
      title: p.name,
      price: Number(p.price || 0),
      category: p.category?.name,
      shopName: p.shop?.name || 'Seller Boutique',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      imageUrl: p.images?.[0]?.imageUrl || undefined,
    }));

    const formattedRecentOrders = recentOrdersList.map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || 'Customer',
      shopName: o.items?.[0]?.shop?.name || 'Navya Boutique',
      totalAmount: Number(o.totalAmount || 0),
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'PREPAID',
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    }));

    const formattedRecentShops = recentShopsList.map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      ownerName: s.owner?.name || 'Owner',
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
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
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}

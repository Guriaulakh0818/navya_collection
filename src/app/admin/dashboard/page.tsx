import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getAdminUser } from '@/backend/lib/session';
import {
  AdminDashboardClient,
  AdminDashboardData,
} from '@/frontend/features/admin/components/AdminDashboardClient';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Executive Governance Command Center | Navya Admin',
  description:
    'Multi-vendor marketplace governance dashboard for monitoring revenue, seller onboarding, product moderation, and financial payouts.',
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const admin = await getAdminUser();

  if (
    !admin ||
    !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes((admin.role || '').toUpperCase())
  ) {
    redirect('/admin/login');
  }

  // Fetch initial platform data from Prisma with defensive try/catch guard
  let totalOrdersCount = 0;
  let activeShopsCount = 0;
  let pendingSellersCount = 0;
  let pendingProductsCount = 0;
  let totalCustomersCount = 0;
  let pendingSellersList: any[] = [];
  let pendingProductsList: any[] = [];
  let recentOrdersList: any[] = [];
  let recentShopsList: any[] = [];
  let totalRevenue = 0;
  let adminCommissionEarned = 0;
  let pendingPayoutsAmount = 0;

  try {
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
      prisma.product
        .count({ where: { status: { in: ['pending_approval', 'draft'] }, deletedAt: null } })
        .catch(() => 0),
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
          where: { status: { in: ['pending_approval', 'draft'] }, deletedAt: null },
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

    totalOrdersCount = Number(ordersCount || 0);
    activeShopsCount = Number(shopsCount || 0);
    pendingSellersCount = Number(sellersCount || 0);
    pendingProductsCount = Number(productsCount || 0);
    totalCustomersCount = Number(customersCount || 0);
    pendingSellersList = sellersList || [];
    pendingProductsList = productsList || [];
    recentOrdersList = ordersList || [];
    recentShopsList = shopsList || [];
    totalRevenue = Number(ordersAgg?._sum?.totalAmount || 0);
    adminCommissionEarned = Number(vendorOrdersAgg?._sum?.commissionAmount || 0);
    pendingPayoutsAmount = Number(vendorOrdersAgg?._sum?.vendorPayoutAmount || 0);
  } catch (err) {
    console.error('Non-blocking admin dashboard data fetch error:', err);
  }

  const initialData: AdminDashboardData = {
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
    pendingSellers: pendingSellersList.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      ownerName: s.owner?.name || 'Applicant',
      ownerEmail: s.owner?.email || 'N/A',
      ownerMobile: s.owner?.mobile || undefined,
      city: s.addresses?.[0]?.city || undefined,
    })),
    pendingProducts: pendingProductsList.map((p) => ({
      id: p.id,
      title: p.name,
      price: Number(p.price || 0),
      category: p.category?.name,
      shopName: p.shop?.name || 'Seller Boutique',
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      imageUrl: p.images?.[0]?.imageUrl || undefined,
    })),
    recentOrders: recentOrdersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || 'Customer',
      shopName: o.items?.[0]?.shop?.name || 'Navya Boutique',
      totalAmount: Number(o.totalAmount || 0),
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'PREPAID',
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : new Date().toISOString(),
    })),
    recentShops: recentShopsList.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      ownerName: s.owner?.name || 'Owner',
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
    })),
  };

  return <AdminDashboardClient initialData={initialData} />;
}

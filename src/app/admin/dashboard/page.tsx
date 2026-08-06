import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/backend/lib/session';
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
  const admin = await getCurrentUser();

  if (
    !admin ||
    !['OWNER', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR'].includes(admin.role?.toUpperCase())
  ) {
    redirect('/admin/login');
  }

  // Fetch initial live platform data from Prisma
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
  const adminCommissionEarned = Math.round(totalRevenue * 0.1);
  const pendingPayoutsAmount = Math.round(totalRevenue * 0.9);

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
      createdAt: s.createdAt.toISOString(),
      ownerName: s.owner?.name || 'Applicant',
      ownerEmail: s.owner?.email || 'N/A',
      ownerMobile: s.owner?.mobile || undefined,
      city: s.addresses[0]?.city || undefined,
    })),
    pendingProducts: pendingProductsList.map((p) => ({
      id: p.id,
      title: p.name,
      price: Number(p.price || 0),
      category: p.category?.name,
      shopName: p.shop?.name || 'Seller Boutique',
      createdAt: p.createdAt.toISOString(),
      imageUrl: p.images[0]?.imageUrl || undefined,
    })),
    recentOrders: recentOrdersList.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || 'Customer',
      shopName: o.items[0]?.shop?.name || 'Navya Boutique',
      totalAmount: Number(o.totalAmount || 0),
      status: o.orderStatus,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod || 'PREPAID',
      createdAt: o.createdAt.toISOString(),
    })),
    recentShops: recentShopsList.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      status: s.status,
      ownerName: s.owner?.name || 'Owner',
      createdAt: s.createdAt.toISOString(),
    })),
  };

  return <AdminDashboardClient initialData={initialData} />;
}

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME } from '@/backend/lib/session';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'navya_collection_jwt_secret_key_2026_min_32chars';
  return new TextEncoder().encode(secret);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required.' },
        { status: 401 },
      );
    }

    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const userId = payload.userId as string;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid session token.' },
        { status: 401 },
      );
    }

    // Find seller's primary shop
    const shop = await prisma.shop.findFirst({
      where: { ownerId: userId, deletedAt: null },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            approvalStatus: true,
          },
        },
        sellerProfile: true,
        addresses: true,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No registered seller shop found for this account.' },
        { status: 404 },
      );
    }

    if (shop.name) {
      const expectedSlug = shop.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (expectedSlug && shop.slug !== expectedSlug) {
        try {
          const updated = await prisma.shop.update({
            where: { id: shop.id },
            data: { slug: expectedSlug },
          });
          shop.slug = updated.slug;
        } catch {
          // Ignore
        }
      }
    }

    // Metrics Calculation
    const totalProducts = await prisma.product.count({
      where: { shopId: shop.id, deletedAt: null },
    });

    const pendingOrders = await prisma.vendorOrder.count({
      where: {
        shopId: shop.id,
        status: { in: ['PENDING', 'PROCESSING'] },
      },
    });

    const revenueAggregation = await prisma.vendorOrder.aggregate({
      where: {
        shopId: shop.id,
      },
      _sum: {
        vendorPayoutAmount: true,
        totalAmount: true,
      },
    });

    const totalRevenue = Number(
      revenueAggregation._sum.vendorPayoutAmount || revenueAggregation._sum.totalAmount || 0,
    );

    const inventoryAggregation = await prisma.productVariant.aggregate({
      where: {
        product: {
          shopId: shop.id,
          deletedAt: null,
        },
      },
      _sum: {
        stock: true,
      },
    });

    const totalInventoryStock = inventoryAggregation._sum.stock || 0;

    // Recent Vendor Orders
    const recentOrders = await prisma.vendorOrder.findMany({
      where: { shopId: shop.id },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        masterOrder: {
          select: {
            id: true,
            orderNumber: true,
            paymentStatus: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: {
              select: {
                name: true,
                images: { select: { imageUrl: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    // Mock/Generated Monthly Revenue Data for Analytics Chart
    const monthlyRevenue = [
      { month: 'Jan', revenue: Math.round(totalRevenue * 0.1) },
      { month: 'Feb', revenue: Math.round(totalRevenue * 0.15) },
      { month: 'Mar', revenue: Math.round(totalRevenue * 0.12) },
      { month: 'Apr', revenue: Math.round(totalRevenue * 0.18) },
      { month: 'May', revenue: Math.round(totalRevenue * 0.22) },
      { month: 'Jun', revenue: Math.round(totalRevenue * 0.23) },
    ];

    return NextResponse.json({
      success: true,
      data: {
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          status: shop.status,
          verificationBadge: shop.verificationBadge,
          rating: shop.rating,
          reviewCount: shop.reviewCount,
          commissionRate: Number(shop.commissionRate),
          subscriptionTier: shop.subscriptionTier,
        },
        owner: shop.owner,
        sellerProfile: shop.sellerProfile,
        metrics: {
          totalProducts,
          pendingOrders,
          totalRevenue,
          totalInventoryStock,
        },
        monthlyRevenue,
        recentOrders,
      },
    });
  } catch (error: any) {
    console.error('❌ GET Seller Dashboard API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to load seller dashboard analytics.' },
      { status: 500 },
    );
  }
}

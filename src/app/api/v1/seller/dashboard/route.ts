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

// High-performance in-memory cache for seller dashboard: TTL 15 seconds
const dashboardCache = new Map<string, { timestamp: number; payload: any }>();
const CACHE_TTL_MS = 15000;

export async function GET(request: Request) {
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
    let shop = await prisma.shop.findFirst({
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
      // Fallback: check if user owns any shop via User model relation
      const userWithShop = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          ownedShops: {
            where: { deletedAt: null },
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
            take: 1,
          },
        },
      });

      if (userWithShop?.ownedShops?.[0]) {
        shop = userWithShop.ownedShops[0];
      }
    }

    if (!shop) {
      return NextResponse.json(
        { success: false, message: 'No registered seller shop found for this account.' },
        { status: 404 },
      );
    }

    // Serve from hot in-memory cache if requested within TTL (unless ?fresh=true)
    const cacheKey = `seller_dashboard_${shop.id}`;
    const url = new URL(request.url);
    const forceFresh = url.searchParams.get('fresh') === 'true';
    const cached = dashboardCache.get(cacheKey);
    const now = Date.now();

    if (!forceFresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.payload, {
        headers: {
          'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
        },
      });
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

    // Compute Date boundary for 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Parallel Execution of all independent queries for maximum performance
    const [
      totalProducts,
      pendingOrders,
      revenueAggregation,
      inventoryAggregation,
      recentOrders,
      pastOrders,
      allVendorOrders,
    ] = await Promise.all([
      prisma.product.count({
        where: { shopId: shop.id, deletedAt: null },
      }),
      prisma.vendorOrder.count({
        where: {
          shopId: shop.id,
          status: { in: ['PENDING', 'PROCESSING'] },
        },
      }),
      prisma.vendorOrder.aggregate({
        where: {
          shopId: shop.id,
        },
        _sum: {
          vendorPayoutAmount: true,
          totalAmount: true,
        },
      }),
      prisma.productVariant.aggregate({
        where: {
          product: {
            shopId: shop.id,
            deletedAt: null,
          },
        },
        _sum: {
          stock: true,
        },
      }),
      prisma.vendorOrder.findMany({
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
                  images: {
                    select: { imageUrl: true },
                    take: 1,
                    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                  },
                },
              },
            },
          },
        },
      }),
      prisma.vendorOrder.findMany({
        where: {
          shopId: shop.id,
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          vendorPayoutAmount: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.vendorOrder.findMany({
        where: { shopId: shop.id },
        select: {
          id: true,
          status: true,
          shippingStatus: true,
        },
      }),
    ]);

    const totalRevenue = Number(
      revenueAggregation._sum.vendorPayoutAmount || revenueAggregation._sum.totalAmount || 0,
    );

    const totalInventoryStock = inventoryAggregation._sum.stock || 0;

    // Calculate live Order Fulfillment metrics from database
    let deliveredCount = 0;
    let pendingDispatchCount = 0;
    let returnsCount = 0;

    allVendorOrders.forEach((order) => {
      const isDelivered = order.status === 'DELIVERED' || order.shippingStatus === 'DELIVERED';
      const isReturnOrCancel =
        ['RETURN_REQUESTED', 'RETURNED', 'EXCHANGED', 'RTO', 'CANCELLED'].includes(order.status) ||
        ['RTO', 'CANCELLED', 'FAILED', 'RTO_INITIATED', 'RTO_IN_TRANSIT', 'RTO_DELIVERED'].includes(
          order.shippingStatus,
        );

      if (isDelivered) {
        deliveredCount++;
      } else if (isReturnOrCancel) {
        returnsCount++;
      } else {
        pendingDispatchCount++;
      }
    });

    const totalFulfillmentOrders = allVendorOrders.length;
    const deliveredPct =
      totalFulfillmentOrders > 0 ? Math.round((deliveredCount / totalFulfillmentOrders) * 100) : 0;
    const pendingPct =
      totalFulfillmentOrders > 0
        ? Math.round((pendingDispatchCount / totalFulfillmentOrders) * 100)
        : 0;
    const returnsPct =
      totalFulfillmentOrders > 0 ? Math.round((returnsCount / totalFulfillmentOrders) * 100) : 0;

    const fulfillment = {
      total: totalFulfillmentOrders,
      delivered: {
        count: deliveredCount,
        percentage: deliveredPct,
      },
      pendingDispatch: {
        count: pendingDispatchCount,
        percentage: pendingPct,
      },
      returns: {
        count: returnsCount,
        percentage: returnsPct,
      },
    };

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthlyMap = new Map<string, number>();

    // Initialize 6 months in sequence
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = monthNames[d.getMonth()];
      monthlyMap.set(mName, 0);
    }

    // Populate with actual DB vendor orders
    pastOrders.forEach((o) => {
      const mName = monthNames[new Date(o.createdAt).getMonth()];
      const amt = Number(o.vendorPayoutAmount || o.totalAmount || 0);
      monthlyMap.set(mName, (monthlyMap.get(mName) || 0) + amt);
    });

    const monthlyRevenue = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
    }));

    const responsePayload = {
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
        fulfillment,
      },
    };

    // Update in-memory cache
    dashboardCache.set(cacheKey, { timestamp: now, payload: responsePayload });

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30',
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

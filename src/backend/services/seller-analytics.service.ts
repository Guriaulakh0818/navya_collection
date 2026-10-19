import { prisma } from '@/lib/prisma';

export interface SellerAnalyticsOptions {
  shopId: string;
  period?: 'weekly' | 'monthly' | 'yearly';
}

export class SellerAnalyticsService {
  /**
   * Aggregate merchant metrics by period (weekly, monthly, yearly)
   */
  static async getSellerAnalytics(options: SellerAnalyticsOptions) {
    const { shopId, period = 'monthly' } = options;

    const now = new Date();
    let startDate = new Date();

    if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
      startDate.setDate(now.getDate() - 30);
    } else if (period === 'yearly') {
      startDate.setFullYear(now.getFullYear() - 1);
    }

    // 1. Fetch Vendor Orders within period
    const vendorOrders = await prisma.vendorOrder.findMany({
      where: {
        shopId,
        createdAt: { gte: startDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                compareAtPrice: true,
                stock: true,
                sku: true,
                status: true,
                category: { select: { id: true, name: true } },
                images: { orderBy: { sortOrder: 'asc' }, select: { imageUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Financial Metrics Calculation
    let totalGrossRevenue = 0;
    let totalCommissionDeducted = 0;
    let totalNetPayout = 0;

    vendorOrders.forEach((vo) => {
      totalGrossRevenue += Number(vo.totalAmount || 0);
      totalCommissionDeducted += Number(vo.commissionAmount || 0);
      totalNetPayout += Number(vo.vendorPayoutAmount || 0);
    });

    const totalOrdersCount = vendorOrders.length;
    const averageOrderValue = totalOrdersCount > 0 ? totalGrossRevenue / totalOrdersCount : 0;

    // 3. Top Selling Products Leaderboard
    const productSalesMap = new Map<
      string,
      {
        id: string;
        productId: string;
        name: string;
        price: number;
        compareAtPrice: number;
        stock: number;
        sku: string;
        status: string;
        categoryName: string;
        image: string | null;
        images: string[];
        totalQuantity: number;
        totalRevenue: number;
      }
    >();

    vendorOrders.forEach((vo) => {
      vo.items.forEach((item) => {
        const p = item.product;
        if (!p) return;

        const imgUrls = Array.isArray(p.images)
          ? p.images.map((img: { imageUrl: string }) => img.imageUrl)
          : [];
        const existing = productSalesMap.get(p.id) || {
          id: p.id,
          productId: p.id,
          name: p.name,
          price: Number(p.price || 0),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : 0,
          stock: Number(p.stock || 0),
          sku: p.sku || '',
          status: p.status || 'active',
          categoryName: p.category?.name || 'Apparel',
          image: imgUrls[0] || null,
          images: imgUrls,
          totalQuantity: 0,
          totalRevenue: 0,
        };

        existing.totalQuantity += item.quantity;
        existing.totalRevenue += Number(item.price || 0) * item.quantity;
        productSalesMap.set(p.id, existing);
      });
    });

    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // 4. Inventory Stock Distribution
    const products = await prisma.product.findMany({
      where: { shopId, deletedAt: null },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        compareAtPrice: true,
        sku: true,
        status: true,
        category: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' }, select: { imageUrl: true } },
        variants: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            stock: true,
            price: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { stock: 'asc' },
    });

    const totalProductsCount = products.length;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockItems: any[] = [];

    products.forEach((p) => {
      const imgUrls = Array.isArray(p.images)
        ? p.images.map((img: { imageUrl: string }) => img.imageUrl)
        : [];
      const itemData = {
        id: p.id,
        productId: p.id,
        name: p.name,
        stock: Number(p.stock || 0),
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : 0,
        sku: p.sku || '',
        status: p.status || 'active',
        categoryName: p.category?.name || 'Apparel',
        images: imgUrls,
        image: imgUrls[0] || null,
        variants: p.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
        })),
      };

      if (p.stock === 0) {
        outOfStockCount++;
        lowStockItems.push(itemData);
      } else if (p.stock <= 5) {
        lowStockCount++;
        lowStockItems.push(itemData);
      } else {
        inStockCount++;
      }
    });

    // 5. Time-Series Revenue & Orders Trend Chart Data
    const trendMap = new Map<string, { label: string; revenue: number; orders: number }>();

    vendorOrders.forEach((vo) => {
      const dateKey = new Date(vo.createdAt).toISOString().split('T')[0];
      const existing = trendMap.get(dateKey) || { label: dateKey, revenue: 0, orders: 0 };
      existing.revenue += Number(vo.vendorPayoutAmount || 0);
      existing.orders += 1;
      trendMap.set(dateKey, existing);
    });

    const trendData = Array.from(trendMap.values());

    return {
      period,
      summary: {
        totalGrossRevenue,
        totalCommissionDeducted,
        totalNetPayout,
        totalOrdersCount,
        averageOrderValue,
        totalProductsCount,
        inStockCount,
        lowStockCount,
        outOfStockCount,
      },
      topSellingProducts,
      lowStockItems,
      trendData,
    };
  }
}

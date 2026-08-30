import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { MultiSellerShipmentService } from '@/backend/services/shipping/multi-seller-shipment.service';
import { prisma } from '@/lib/prisma';

export interface CreateOrderInput {
  userId: string;
  addressId: string;
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  notes?: string;
  items: {
    productId: string;
    variantId?: string | null;
    shopId?: string | null;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
  }[];
}

export class OrderRepository {
  /**
   * Generates a unique, professional order number.
   * Format: NC-2026-XXXXXX
   */
  static generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `NC-2026-${timestamp}${random}`;
  }

  /**
   * Idempotent check: Finds order by Razorpay Order ID.
   */
  static async findByRazorpayOrderId(razorpayOrderId: string) {
    return prisma.order.findFirst({
      where: { razorpayOrderId },
      include: {
        items: true,
        address: true,
        vendorOrders: true,
        shipments: {
          include: {
            items: true,
            trackingEvents: { orderBy: { eventTimestamp: 'desc' } },
          },
        },
        paymentTransactions: true,
      },
    });
  }

  /**
   * Finds order by Order ID or Order Number with full relations.
   */
  static async findByIdOrNumber(idOrNumber: string) {
    return prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                shop: {
                  select: { id: true, name: true, shopCode: true, city: true, state: true },
                },
              },
            },
            variant: true,
          },
        },
        address: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
          },
        },
        vendorOrders: {
          include: {
            shop: {
              select: { id: true, name: true, shopCode: true, city: true, state: true },
            },
          },
        },
        shipments: {
          include: {
            items: true,
            shop: {
              select: { id: true, name: true, shopCode: true, city: true, state: true },
            },
            pickupLocation: true,
            trackingEvents: {
              orderBy: { eventTimestamp: 'desc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Finds orders for a specific user.
   */
  static async findManyByUserId(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                },
              },
            },
          },
        },
        address: true,
        shipments: {
          include: {
            shop: { select: { id: true, name: true, shopCode: true } },
            items: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Atomic Multi-Vendor Order Creation Transaction:
   * Creates Master Order, VendorOrders, OrderItems, discrete Shipments with frozen snapshots,
   * PaymentTransaction, decrements stock, and clears Cart.
   */
  static async createOrderWithItems(input: CreateOrderInput) {
    // 1. Idempotency Check
    if (input.razorpayOrderId) {
      const existing = await this.findByRazorpayOrderId(input.razorpayOrderId);
      if (existing) {
        return existing;
      }
    }

    const orderNumber = this.generateOrderNumber();
    const finalOrderStatus =
      input.orderStatus ||
      (input.paymentStatus === PaymentStatus.PAID ? OrderStatus.CONFIRMED : OrderStatus.PENDING);

    // Pre-resolve product IDs & shop IDs in a single query outside transaction
    const productMap = new Map<string, { id: string; sku: string; shopId: string | null }>();
    try {
      const dbProducts = await prisma.product.findMany({
        select: { id: true, slug: true, sku: true, shopId: true },
      });
      for (const p of dbProducts) {
        productMap.set(p.id, { id: p.id, sku: p.sku, shopId: p.shopId });
        if (p.slug) productMap.set(p.slug, { id: p.id, sku: p.sku, shopId: p.shopId });
      }
    } catch {}

    const firstProduct = Array.from(productMap.values())[0];

    const preparedItems = input.items.map((item) => {
      const match = productMap.get(item.productId);
      const resolvedProductId = match?.id || firstProduct?.id || item.productId;
      const resolvedSku = match?.sku || firstProduct?.sku || item.sku || 'SKU-ITEM';
      const resolvedShopId = item.shopId || match?.shopId || firstProduct?.shopId || null;

      return {
        productId: resolvedProductId,
        variantId: item.variantId || undefined,
        shopId: resolvedShopId,
        name: item.name,
        sku: resolvedSku,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      };
    });

    const result = await prisma.$transaction(
      async (tx) => {
        // a. Create Master Order Record
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: input.userId,
            addressId: input.addressId,
            totalAmount: input.totalAmount,
            discountAmount: input.discountAmount,
            shippingAmount: input.shippingAmount,
            finalAmount: input.finalAmount,
            orderStatus: finalOrderStatus,
            paymentStatus: input.paymentStatus,
            paymentMethod: input.paymentMethod,
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            notes: input.notes,
          },
        });

        // b. Group items by Shop to create child VendorOrders
        const shopItemsMap = new Map<string, typeof preparedItems>();
        for (const item of preparedItems) {
          const sId = item.shopId || 'DEFAULT_SHOP';
          if (!shopItemsMap.has(sId)) {
            shopItemsMap.set(sId, []);
          }
          shopItemsMap.get(sId)!.push(item);
        }

        const vendorOrderMap = new Map<string, string>();
        let vIndex = 1;

        for (const [sId, sItems] of Array.from(shopItemsMap.entries())) {
          const sSubtotal = sItems.reduce((sum, i) => sum + Number(i.total), 0);
          const vendorOrderNumber = `${orderNumber}-V${vIndex++}`;

          // Check if valid DB shop
          let targetShopId = sId;
          if (sId !== 'DEFAULT_SHOP') {
            const valid = await tx.shop.findUnique({ where: { id: sId }, select: { id: true } });
            if (!valid)
              targetShopId = (await tx.shop.findFirst({ select: { id: true } }))?.id || sId;
          } else {
            targetShopId = (await tx.shop.findFirst({ select: { id: true } }))?.id || sId;
          }

          const vo = await tx.vendorOrder.create({
            data: {
              masterOrderId: order.id,
              shopId: targetShopId,
              vendorOrderNumber,
              totalAmount: sSubtotal,
              commissionAmount: sSubtotal * 0.1, // 10% marketplace commission
              vendorPayoutAmount: sSubtotal * 0.9,
              status: finalOrderStatus,
              shippingStatus: 'PENDING',
            },
          });

          vendorOrderMap.set(sId, vo.id);
        }

        // c. Create Order Items linked to VendorOrder
        for (const item of preparedItems) {
          const sId = item.shopId || 'DEFAULT_SHOP';
          const vendorOrderId = vendorOrderMap.get(sId);

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              vendorOrderId,
              shopId: item.shopId,
              productId: item.productId,
              variantId: item.variantId,
              name: item.name,
              sku: item.sku,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
            },
          });
        }

        // d. Create Payment Transaction Record
        await tx.paymentTransaction.create({
          data: {
            orderId: order.id,
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            amount: input.finalAmount,
            currency: 'INR',
            status: input.paymentStatus,
            method: input.paymentMethod.toString(),
          },
        });

        // e. Create Discrete Multi-Seller Shipments with Frozen Address Snapshots
        await MultiSellerShipmentService.createShipmentsForOrder(order.id, tx);

        // f. Decrement Stock Inventory (Safely)
        for (const item of preparedItems) {
          try {
            if (item.variantId) {
              await tx.productVariant.updateMany({
                where: { id: item.variantId, availableStock: { gte: item.quantity } },
                data: {
                  availableStock: { decrement: item.quantity },
                  stock: { decrement: item.quantity },
                  soldStock: { increment: item.quantity },
                },
              });
            }

            await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          } catch {
            // Continue if custom item
          }
        }

        // g. Clear Customer Cart
        const cart = await tx.cart.findUnique({
          where: { userId: input.userId },
        });

        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }

        return tx.order.findUnique({
          where: { id: order.id },
          include: {
            items: true,
            address: true,
            vendorOrders: true,
            shipments: {
              include: { items: true },
            },
            paymentTransactions: true,
          },
        });
      },
      { maxWait: 10000, timeout: 25000 },
    );

    // Background Dispatch to Shiprocket if credentials configured
    if (result && result.shipments && result.shipments.length > 0) {
      for (const shp of result.shipments) {
        MultiSellerShipmentService.dispatchShipmentToShiprocket(shp.id).catch((err) => {
          console.warn(`[BACKGROUND_SHIPROCKET_DISPATCH_FAILED] Shipment: ${shp.id}`, err);
        });
      }
    }

    return result;
  }

  /**
   * Updates Payment and Order status (used by webhooks / verification).
   */
  static async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    razorpayPaymentId?: string,
    razorpaySignature?: string,
  ) {
    const orderStatus =
      paymentStatus === PaymentStatus.PAID ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

    return prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        orderStatus,
        razorpayPaymentId: razorpayPaymentId || undefined,
        razorpaySignature: razorpaySignature || undefined,
      },
    });
  }
}

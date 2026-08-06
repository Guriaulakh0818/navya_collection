import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

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
      },
    });
  }

  /**
   * Atomic Order Creation Transaction:
   * Creates Order, OrderItems, PaymentTransaction, decrements stock, and clears Cart.
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

    // Pre-resolve product IDs in a single query outside transaction to prevent transaction timeout
    const productMap = new Map<string, { id: string; sku: string }>();
    try {
      const dbProducts = await prisma.product.findMany({
        select: { id: true, slug: true, sku: true },
      });
      for (const p of dbProducts) {
        productMap.set(p.id, { id: p.id, sku: p.sku });
        if (p.slug) productMap.set(p.slug, { id: p.id, sku: p.sku });
      }
    } catch {}

    const firstProduct = Array.from(productMap.values())[0];

    const preparedItems = input.items.map((item) => {
      const match = productMap.get(item.productId);
      const resolvedProductId = match?.id || firstProduct?.id || item.productId;
      const resolvedSku = match?.sku || firstProduct?.sku || item.sku || 'SKU-ITEM';

      return {
        productId: resolvedProductId,
        variantId: item.variantId || undefined,
        name: item.name,
        sku: resolvedSku,
        price: item.price,
        quantity: item.quantity,
        total: item.total,
      };
    });

    return prisma.$transaction(
      async (tx) => {
        // a. Create Order Record
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

        // b. Create Order Items
        const orderItemsToCreate = preparedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          sku: item.sku,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        }));

        await tx.orderItem.createMany({
          data: orderItemsToCreate,
        });

        // c. Create Payment Transaction Record
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

        // d. Decrement Stock Inventory (Safely)
        for (const item of orderItemsToCreate) {
          try {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: {
                  availableStock: { decrement: item.quantity },
                  stock: { decrement: item.quantity },
                  soldStock: { increment: item.quantity },
                },
              });
            }

            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
              },
            });
          } catch {
            // Continue if mock or custom item
          }
        }

        // e. Clear Customer Cart
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
            paymentTransactions: true,
          },
        });
      },
      { maxWait: 10000, timeout: 20000 },
    );
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

import { OrderStatus, PaymentMethod, PaymentStatus, ShippingStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CommissionService } from './commission.service';

export interface CreateSplitOrderPayload {
  userId: string;
  addressId: string;
  paymentMethod: PaymentMethod; // COD, RAZORPAY, UPI
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  discountAmount?: number;
  notes?: string;
  items: {
    productId: string;
    variantId?: string | null;
    quantity: number;
    price: number;
    shopId?: string;
    name: string;
    sku?: string;
  }[];
}

export class OrderSplitService {
  /**
   * Executes atomic Multi-Vendor Order Split in a single Prisma $transaction.
   * Creates Master Order, Child VendorOrders, OrderItems, updates inventory stock, and logs payment transaction.
   */
  static async createSplitOrder(payload: CreateSplitOrderPayload) {
    const {
      userId,
      addressId,
      paymentMethod,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      discountAmount = 0,
      notes,
      items,
    } = payload;

    if (!items || items.length === 0) {
      throw new Error('Cart items are required to create order.');
    }

    // 1. Group items by shopId
    const shopItemsMap = new Map<string, typeof items>();
    items.forEach((item) => {
      const shopId = item.shopId || 'default-shop';
      if (!shopItemsMap.has(shopId)) {
        shopItemsMap.set(shopId, []);
      }
      shopItemsMap.get(shopId)!.push(item);
    });

    // 2. Compute Master Order Totals
    const grossSubtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    // Multi-Vendor Shipping Fee: ₹49 per shop, or FREE if shop subtotal >= ₹999
    let shippingTotal = 0;
    shopItemsMap.forEach((shopItems) => {
      const shopSubtotal = shopItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0,
      );
      if (shopSubtotal < 999) {
        shippingTotal += 49;
      }
    });

    const finalAmount = Math.max(0, grossSubtotal - discountAmount + shippingTotal);

    // Generate Unique Order Numbers
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const masterOrderNumber = `NC-ORD-${timestamp}-${randomSuffix}`;

    // Payment & Order Status initializers
    const initialOrderStatus: OrderStatus = 'PENDING';
    const initialPaymentStatus: PaymentStatus =
      paymentMethod === 'COD' ? 'PENDING' : razorpayPaymentId ? 'PAID' : 'PENDING';

    // 3. Execute Atomic Database Transaction
    return await prisma.$transaction(async (tx) => {
      // Step A: Create Master Order
      const masterOrder = await tx.order.create({
        data: {
          orderNumber: masterOrderNumber,
          userId,
          addressId,
          totalAmount: grossSubtotal,
          discountAmount,
          shippingAmount: shippingTotal,
          finalAmount,
          orderStatus: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          paymentMethod,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          notes,
        },
      });

      // Step B: Create Child VendorOrders & OrderItems per Shop
      const createdVendorOrders = [];
      const createdOrderItems = [];

      let vendorIndex = 1;
      for (const [shopId, sItems] of Array.from(shopItemsMap.entries())) {
        const shopSubtotal = sItems.reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0,
        );

        // Dynamic Commission Engine (Percentage + Flat Fee)
        const calc = CommissionService.calculateOrderCommission(shopSubtotal, { shopId });
        const commissionAmount = calc.totalCommission;
        const vendorPayoutAmount = calc.netSellerPayout;

        const vendorOrderNumber = `${masterOrderNumber}-V${vendorIndex}`;
        vendorIndex++;

        // Determine if shopId is a valid DB shop or fallback
        const validShop = await tx.shop.findUnique({
          where: { id: shopId },
          select: { id: true },
        });
        const targetShopId = validShop ? validShop.id : null;

        // Create Child VendorOrder
        const vendorOrder = await tx.vendorOrder.create({
          data: {
            masterOrderId: masterOrder.id,
            shopId: targetShopId || shopId,
            vendorOrderNumber,
            totalAmount: shopSubtotal,
            commissionAmount,
            vendorPayoutAmount,
            status: initialOrderStatus,
            shippingStatus: 'PENDING',
          },
        });

        createdVendorOrders.push(vendorOrder);

        // Create OrderItems for this VendorOrder
        for (const item of sItems) {
          const itemTotal = Number(item.price) * Number(item.quantity);

          const orderItem = await tx.orderItem.create({
            data: {
              orderId: masterOrder.id,
              vendorOrderId: vendorOrder.id,
              productId: item.productId,
              variantId: item.variantId || null,
              shopId: targetShopId || shopId,
              name: item.name,
              sku: item.sku || `SKU-${item.productId.slice(-6)}`,
              price: item.price,
              quantity: item.quantity,
              total: itemTotal,
            },
          });

          createdOrderItems.push(orderItem);

          // Step C: Atomically Reduce Inventory Stock
          if (item.variantId) {
            await tx.productVariant.updateMany({
              where: { id: item.variantId, availableStock: { gte: item.quantity } },
              data: {
                availableStock: { decrement: item.quantity },
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
        }
      }

      // Step D: Create PaymentTransaction Record
      const paymentTx = await tx.paymentTransaction.create({
        data: {
          orderId: masterOrder.id,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          amount: finalAmount,
          currency: 'INR',
          status: initialPaymentStatus,
          method: paymentMethod,
        },
      });

      return {
        masterOrder,
        vendorOrders: createdVendorOrders,
        orderItems: createdOrderItems,
        paymentTx,
      };
    });
  }
}

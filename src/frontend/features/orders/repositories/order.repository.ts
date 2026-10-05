import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { CommissionService } from '@/backend/services/commission.service';
import { OrderEmailNotificationService } from '@/backend/services/order-email.service';
import { MultiSellerShipmentService } from '@/backend/services/shipping/multi-seller-shipment.service';
import { prisma } from '@/lib/prisma';

export interface CreateOrderInput {
  userId: string;
  addressId: string;
  totalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount?: number;
  codFee?: number;
  codFeeTax?: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  notes?: string;
  couponCode?: string | null;
  couponId?: string | null;
  couponType?: string | null;
  couponFundingType?: 'NAVYA' | 'SELLER' | null;
  items: {
    productId: string;
    variantId?: string | null;
    shopId?: string | null;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    compareAtPrice?: number;
    taxRate?: number;
    taxAmount?: number;
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
    return `NC-${timestamp}-${random}`;
  }

  static async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
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
  }

  static async findByIdOrNumber(idOrNumber: string) {
    return prisma.order.findFirst({
      where: {
        OR: [{ id: idOrNumber }, { orderNumber: idOrNumber }],
      },
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
  }

  static async findManyByUserId(userId: string) {
    return this.findByUserId(userId);
  }

  static async findByUserId(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        address: true,
        vendorOrders: true,
        shipments: true,
        paymentTransactions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
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
  }

  static async findByRazorpayOrderId(razorpayOrderId: string) {
    return prisma.order.findFirst({
      where: { razorpayOrderId },
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
  }

  /**
   * Atomically creates an entire multi-seller order with all sub-orders, shipments, transactions, and inventory decrements.
   */
  static async createOrderWithItems(input: CreateOrderInput) {
    const orderNumber = this.generateOrderNumber();
    const finalOrderStatus =
      input.paymentStatus === PaymentStatus.PAID ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

    // 1. Resolve Product & Shop details for each item
    const itemIds = input.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        shopId: true,
        price: true,
        stock: true,
        name: true,
        sku: true,
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const preparedItems = input.items.map((item) => {
      const prod = productMap.get(item.productId);
      return {
        ...item,
        shopId: item.shopId || prod?.shopId || 'DEFAULT_SHOP',
        name: item.name || prod?.name || 'Fashion Item',
        sku: item.sku || prod?.sku || 'SKU-ITEM',
      };
    });

    // 1b. Resolve Applied Coupon and Multi-Seller / Item Allocations (BM-10)
    let resolvedCoupon: any = null;
    let couponAllocation: any = null;
    if (input.couponCode || input.couponId) {
      const { CouponRepository } =
        await import('@/features/coupons/repositories/coupon.repository');
      const { CouponService } = await import('@/features/coupons/services/coupon.service');

      if (input.couponId) {
        resolvedCoupon = await CouponRepository.findById(input.couponId);
      } else if (input.couponCode) {
        resolvedCoupon = await CouponRepository.findByCode(input.couponCode);
      }

      if (resolvedCoupon) {
        couponAllocation = CouponService.allocateCoupon(
          resolvedCoupon,
          preparedItems.map((i) => ({
            productId: i.productId,
            shopId: i.shopId,
            price: i.price,
            quantity: i.quantity,
            total: i.total,
          })),
        );
      }
    }

    const authoritativeDiscount = couponAllocation
      ? couponAllocation.totalDiscount
      : Number(input.discountAmount || 0);

    const couponFundingType: 'NAVYA' | 'SELLER' = resolvedCoupon
      ? resolvedCoupon.fundingType
      : input.couponFundingType || 'NAVYA';

    // 2. BM-04 Authoritative Customer Shipping Recalculation
    const { CustomerShippingService } =
      await import('@/backend/services/shipping/customer-shipping.service');
    const { ShippingPolicyRepository } =
      await import('@/features/shipping/repositories/shipping.repository');

    const firstOrderCheck = await ShippingPolicyRepository.evaluateFirstOrderEligibility(
      input.userId,
    );

    const shippingCalc = await CustomerShippingService.calculateMultiSellerShipping(
      input.userId,
      preparedItems.map((i) => ({
        productId: i.productId,
        shopId: i.shopId,
        quantity: i.quantity,
        price: i.price,
      })),
      {
        customerAddressId: input.addressId,
        shippingMethodCode: 'STANDARD',
        paymentMethod: input.paymentMethod === PaymentMethod.COD ? 'COD' : 'PREPAID',
        isFirstOrder: firstOrderCheck.isEligible,
      },
    );

    const authoritativeShipping = shippingCalc.finalShippingAmount;
    const authoritativeTax = Number(input.taxAmount || 0);

    const isCod = input.paymentMethod === PaymentMethod.COD;
    const sellingPriceSubtotal = preparedItems.reduce(
      (sum, item) => sum + Number(item.total || item.price * item.quantity),
      0,
    );

    // BM-07: Selling price limit applies strictly to product selling prices (subtotal <= ₹5,000)
    if (isCod && sellingPriceSubtotal > 5000) {
      throw new Error(
        `COD_SELLING_PRICE_LIMIT_EXCEEDED: Cash on Delivery is unavailable for orders with product selling price exceeding ₹5,000 (Subtotal: ₹${sellingPriceSubtotal}).`,
      );
    }

    let authoritativeCodFee = 0;
    let authoritativeCodFeeTax = 0;

    if (isCod) {
      const { TaxService } = await import('@/features/tax/services/tax.service');
      const address = await prisma.address.findUnique({
        where: { id: input.addressId },
        select: { state: true },
      });

      // Multi-seller COD fee calculation per seller
      const shopGroups = new Map<string, typeof preparedItems>();
      for (const itm of preparedItems) {
        const sId = itm.shopId || 'DEFAULT_SHOP';
        if (!shopGroups.has(sId)) shopGroups.set(sId, []);
        shopGroups.get(sId)!.push(itm);
      }

      const entries = Array.from(shopGroups.entries());
      let cumCoupon = 0;

      for (let idx = 0; idx < entries.length; idx++) {
        const [sId, sItems] = entries[idx];
        const isLast = idx === entries.length - 1;
        const sSubtotal = sItems.reduce((sum, i) => sum + Number(i.total), 0);

        let sCoupon = 0;
        if (couponAllocation?.sellerAllocations) {
          const alloc = couponAllocation.sellerAllocations.find((s: any) => s.sellerId === sId);
          sCoupon = alloc ? alloc.allocatedDiscount : 0;
        } else if (Number(authoritativeDiscount) > 0 && Number(input.totalAmount) > 0) {
          if (isLast) {
            sCoupon = Math.max(
              0,
              CommissionService.roundMoney(Number(authoritativeDiscount) - cumCoupon),
            );
          } else {
            const ratio = sSubtotal / Number(input.totalAmount);
            sCoupon = CommissionService.roundMoney(Number(authoritativeDiscount) * ratio);
            cumCoupon = CommissionService.roundMoney(cumCoupon + sCoupon);
          }
        }

        const sShipping =
          shippingCalc.sellerBreakdown.find((b: any) => b.sellerId === sId || b.shopId === sId)
            ?.shippingCharge || 0;
        const sTax = sItems.reduce((sum, i) => sum + Number((i as any).taxAmount || 0), 0);

        const sCodBase = Math.max(
          0,
          CommissionService.roundMoney(sSubtotal - sCoupon + sShipping + sTax),
        );
        const sCodFee = CommissionService.roundMoney(sCodBase * 0.015);
        const sCodTaxRes = await TaxService.calculateCodFeeTax({
          codFee: sCodFee,
          customerState: address?.state,
        });

        authoritativeCodFee = CommissionService.roundMoney(authoritativeCodFee + sCodFee);
        authoritativeCodFeeTax = CommissionService.roundMoney(
          authoritativeCodFeeTax + sCodTaxRes.taxAmount,
        );
      }
    }

    const authoritativeFinalAmount = Math.max(
      0,
      CommissionService.roundMoney(
        Number(input.totalAmount) -
          authoritativeDiscount +
          authoritativeShipping +
          authoritativeTax +
          authoritativeCodFee +
          authoritativeCodFeeTax,
      ),
    );

    const result = await prisma.$transaction(
      async (tx) => {
        // a. Create Master Order Record
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: input.userId,
            addressId: input.addressId,
            totalAmount: input.totalAmount,
            discountAmount: authoritativeDiscount,
            couponId: resolvedCoupon?.id || input.couponId || null,
            couponCode: resolvedCoupon?.code || input.couponCode || null,
            couponType: resolvedCoupon?.discountType || input.couponType || null,
            couponFundingType:
              authoritativeDiscount > 0 || resolvedCoupon ? couponFundingType : null,
            shippingAmount: authoritativeShipping,
            taxAmount: authoritativeTax,
            codFee: authoritativeCodFee,
            codFeeTax: authoritativeCodFeeTax,
            codVerificationStatus: isCod ? 'PENDING' : 'NONE',
            finalAmount: authoritativeFinalAmount,
            orderStatus: isCod ? OrderStatus.PENDING : finalOrderStatus,
            paymentStatus: input.paymentStatus,
            paymentMethod: input.paymentMethod,
            shippingMode: shippingCalc.shippingMethodCode,
            isFirstOrder: firstOrderCheck.isEligible,
            shippingWaiverSource: shippingCalc.sellers[0]?.freeShippingSource || null,
            shippingCostBearer: shippingCalc.sellers[0]?.costBearer || null,
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            notes: input.notes,
          },
        });

        // b. Create Order Items with Coupon Snapshots (BM-10)
        for (const item of preparedItems) {
          const existingProd = await tx.product.findUnique({
            where: { id: item.productId },
            select: { id: true },
          });

          if (!existingProd) {
            let cat = await tx.category.findFirst({ select: { id: true } });
            if (!cat) {
              cat = await tx.category.create({
                data: { name: 'General', slug: `general-${Date.now()}` },
              });
            }
            await tx.product.create({
              data: {
                id: item.productId,
                name: item.name || 'Product',
                slug: `prod-${item.productId.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}-${Date.now()}`,
                sku: item.sku || `SKU-${item.productId.slice(-8)}`,
                description: item.name || 'Product description',
                price: item.price,
                stock: 100,
                categoryId: cat.id,
              },
            });
          }

          const itmAlloc = couponAllocation?.itemAllocations?.find(
            (a: any) => a.productId === item.productId,
          );

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              variantId: item.variantId || null,
              name: item.name,
              sku: item.sku,
              price: item.price,
              quantity: item.quantity,
              total: item.total,
              taxRate: item.taxRate ? Number(item.taxRate) : undefined,
              taxAmount: item.taxAmount ? Number(item.taxAmount) : undefined,
              couponId: resolvedCoupon?.id || null,
              navyaCouponAmount: itmAlloc ? itmAlloc.navyaCouponAmount : 0,
              sellerCouponAmount: itmAlloc ? itmAlloc.sellerCouponAmount : 0,
            },
          });
        }

        // c. Group Items by Seller / Shop for Vendor Orders
        const itemsByShop = new Map<string, typeof preparedItems>();
        for (const itm of preparedItems) {
          const list = itemsByShop.get(itm.shopId) || [];
          list.push(itm);
          itemsByShop.set(itm.shopId, list);
        }

        for (const [shopId, sItems] of Array.from(itemsByShop.entries())) {
          const sSubtotal = sItems.reduce((sum, i) => sum + Number(i.total), 0);
          const shopRecord = await tx.shop.findUnique({
            where: { id: shopId },
            select: { ownerId: true },
          });

          if (shopRecord) {
            const vendorOrderNumber = `${orderNumber}-${shopId.slice(-4)}`;
            let shopCommission = 0;
            let shopPayout = 0;
            for (const item of sItems) {
              const commRes = CommissionService.calculateItemCommission({
                mrp: (item as any).compareAtPrice || item.price,
                sellingPrice: item.price,
                quantity: item.quantity,
              });
              shopCommission = CommissionService.roundMoney(
                shopCommission + commRes.commissionAmount,
              );
              shopPayout = CommissionService.roundMoney(shopPayout + commRes.sellerTotalPayout);
            }

            const sAlloc = couponAllocation?.sellerAllocations?.find(
              (s: any) => s.sellerId === shopId,
            );
            const sCouponDiscount = sAlloc ? sAlloc.allocatedDiscount : 0;

            // BM-10: If SELLER-funded, deduct from seller payout. Navya commission is unchanged (MRP * 10%).
            const adjustedShopPayout =
              couponFundingType === 'SELLER'
                ? Math.max(0, CommissionService.roundMoney(shopPayout - sCouponDiscount))
                : shopPayout;

            await tx.vendorOrder.create({
              data: {
                masterOrderId: order.id,
                shopId,
                vendorOrderNumber,
                totalAmount: sSubtotal,
                commissionAmount: shopCommission,
                vendorPayoutAmount: adjustedShopPayout,
                allocatedCouponAmount: sCouponDiscount,
                couponFundingType: sCouponDiscount > 0 ? couponFundingType : null,
                status: 'PENDING',
              },
            });

            // BM-10: Navya Promotional Subsidy Accounting
            if (couponFundingType === 'NAVYA' && sCouponDiscount > 0) {
              await tx.financialAuditLog.create({
                data: {
                  entityType: 'PROMOTIONAL_SUBSIDY',
                  entityId: order.id,
                  action: 'NAVYA_PROMOTIONAL_SUBSIDY_APPLIED',
                  amount: sCouponDiscount,
                  notes: `Navya promotional subsidy applied for shop ${shopId} under coupon ${resolvedCoupon?.code || input.couponCode}: ₹${sCouponDiscount}`,
                },
              });
            }
          }
        }

        // d. Atomically Record Coupon Usage (BM-10 Concurrency & Limits)
        if (resolvedCoupon?.id) {
          const { CouponRepository } =
            await import('@/features/coupons/repositories/coupon.repository');
          const usageRes = await CouponRepository.recordUsage(
            resolvedCoupon.id,
            input.userId,
            order.id,
            tx,
          );
          if (!usageRes.success) {
            throw new Error(`COUPON_USAGE_LIMIT_EXCEEDED: ${usageRes.message}`);
          }
        }

        // d. Record Initial Payment Transaction Record
        const isRazorpay = input.paymentMethod === PaymentMethod.RAZORPAY;
        let estimatedGatewayFee = 0;
        let estimatedGatewayTax = 0;
        let estimatedTotalGatewayCost = 0;

        if (isRazorpay) {
          const { PaymentGatewayConfigService } =
            await import('@/backend/services/payment-gateway-config.service');
          const est = await PaymentGatewayConfigService.estimateGatewayFee({
            amount: authoritativeFinalAmount,
            provider: 'RAZORPAY',
            paymentMethod: input.paymentMethod.toString(),
            transactionDate: order.createdAt,
            client: tx,
          });
          estimatedGatewayFee = est.fee;
          estimatedGatewayTax = est.tax;
          estimatedTotalGatewayCost = est.total;
        }

        await tx.paymentTransaction.create({
          data: {
            orderId: order.id,
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            amount: authoritativeFinalAmount,
            currency: 'INR',
            status: input.paymentStatus,
            method: input.paymentMethod.toString(),
            gatewayFee: estimatedGatewayFee,
            gatewayTax: estimatedGatewayTax,
            netAmount: isRazorpay
              ? CommissionService.roundMoney(authoritativeFinalAmount - estimatedTotalGatewayCost)
              : authoritativeFinalAmount,
            gatewayFeeStatus: 'ESTIMATED',
          },
        });

        // e. Create Discrete Multi-Seller Shipments with Frozen Address Snapshots
        await MultiSellerShipmentService.createShipmentsForOrder(order.id, tx);

        // f. Decrement Stock Inventory Atomically (BM-06 Inventory Race Protection)
        for (const item of preparedItems) {
          if (item.variantId) {
            const variantRes = await tx.productVariant.updateMany({
              where: { id: item.variantId, availableStock: { gte: item.quantity } },
              data: {
                availableStock: { decrement: item.quantity },
                stock: { decrement: item.quantity },
                soldStock: { increment: item.quantity },
              },
            });
            if (variantRes.count === 0) {
              const variantExists = await tx.productVariant.findUnique({
                where: { id: item.variantId },
                select: { availableStock: true },
              });
              if (variantExists && variantExists.availableStock < item.quantity) {
                throw new Error(
                  `INSUFFICIENT_STOCK: Item '${item.name}' variant has only ${variantExists.availableStock} unit(s) remaining in stock.`,
                );
              }
            }
          }

          const prodRes = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: {
              stock: { decrement: item.quantity },
            },
          });
          if (prodRes.count === 0) {
            const prodExists = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true },
            });
            if (prodExists && prodExists.stock < item.quantity) {
              throw new Error(
                `INSUFFICIENT_STOCK: Product '${item.name}' has only ${prodExists.stock} unit(s) remaining in stock.`,
              );
            }
          }
        }

        // Gateway Fee Accounting: Record platform absorption of gateway cost under BM-06 & BM-11
        if (isRazorpay) {
          await tx.financialAuditLog.create({
            data: {
              entityType: 'GATEWAY_FEE',
              entityId: order.id,
              action: 'RECORD_GATEWAY_FEE_ESTIMATED',
              amount: estimatedTotalGatewayCost,
              notes: `Payment gateway fee estimated (2% MDR ₹${estimatedGatewayFee} + 18% GST ₹${estimatedGatewayTax}) absorbed by Navya Collection`,
              idempotencyKey: `GW_FEE_EST:${order.id}`,
            },
          });
        }

        // BM-11: Record Initial Order Unit Economics & Contribution Snapshot
        try {
          const { ContributionService } = await import('@/backend/services/contribution.service');
          await ContributionService.recordOrderContribution(
            order.id,
            'PAYMENT_CAPTURED' as any,
            tx,
          );
        } catch (contribErr) {
          console.warn('[BM11_INITIAL_CONTRIBUTION_WARN]', contribErr);
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

    // Automated Transactional Email Dispatch (Seller, Admin, Customer)
    if (result?.id) {
      OrderEmailNotificationService.notifyOrderCreated(result.id).catch((emailErr) => {
        console.warn(`[ORDER_EMAIL_NOTIFICATION_ERROR] Order: ${result.id}`, emailErr);
      });
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

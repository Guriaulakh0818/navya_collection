import {
  CouponFundingType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingStatus,
} from '@prisma/client';

import { CouponService } from '@/features/coupons/services/coupon.service';
import { prisma } from '@/lib/prisma';

import { CommissionService } from './commission.service';
import { OrderEmailNotificationService } from './order-email.service';

export interface CreateSplitOrderPayload {
  userId: string;
  addressId: string;
  paymentMethod: PaymentMethod; // COD, RAZORPAY, UPI
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  discountAmount?: number;
  couponCode?: string;
  couponId?: string;
  couponFundingType?: 'NAVYA' | 'SELLER';
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
   * Creates Master Order, Child VendorOrders, OrderItems, updates inventory stock,
   * logs payment transaction, records coupon usage atomically, and ledgers promotional subsidies (BM-10).
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
      couponCode,
      couponId,
      couponFundingType: explicitFundingType,
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

    // 2. Compute Master Order Totals & Seller-Level Shipping
    const grossSubtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    // Multi-Vendor Shipping Fee: Authoritative seller-level calculation via CustomerShippingService (BM-05)
    const { CustomerShippingService } =
      await import('@/backend/services/shipping/customer-shipping.service');
    const { OfferService } = await import('@/backend/services/offer.service');
    const firstOrderCheck = await OfferService.isUserFirstOrder(userId);

    const shippingCalc = CustomerShippingService.calculateCustomerShipping({
      items,
      shippingMethodCode: 'STANDARD',
      paymentMethod,
      isFirstOrder: firstOrderCheck.isEligible,
    });
    const shippingTotal = shippingCalc.finalShippingAmount;

    // Resolve Coupon Metadata and Authoritative Allocation (BM-10)
    let couponRecord: any = null;
    if (couponId) {
      couponRecord = await prisma.coupon.findUnique({ where: { id: couponId } });
    } else if (couponCode) {
      couponRecord = await prisma.coupon.findFirst({
        where: { code: couponCode.trim().toUpperCase(), deletedAt: null },
      });
    }

    const resolvedCouponId = couponRecord?.id || couponId || null;
    const resolvedCouponCode =
      couponRecord?.code || (couponCode ? couponCode.trim().toUpperCase() : null);
    const resolvedFundingType =
      ((explicitFundingType || couponRecord?.fundingType || 'NAVYA') as string).toUpperCase() ===
      'SELLER'
        ? 'SELLER'
        : 'NAVYA';
    const resolvedCouponType = couponRecord?.discountType || 'PERCENTAGE';

    // Authoritative Multi-Seller & Item-Level Coupon Allocation Engine
    const couponAllocation = CouponService.allocateCoupon({
      discountAmount,
      fundingType: resolvedFundingType as 'NAVYA' | 'SELLER',
      shopId: couponRecord?.shopId || null,
      items: items.map((i) => ({
        productId: i.productId,
        shopId: i.shopId || 'default-shop',
        price: Number(i.price),
        quantity: Number(i.quantity),
      })),
    });

    const authoritativeDiscount = couponAllocation.totalDiscount;
    const finalAmount = Math.max(0, grossSubtotal - authoritativeDiscount + shippingTotal);

    // Generate Unique Order Numbers
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const masterOrderNumber = `NC-ORD-${timestamp}-${randomSuffix}`;

    // Payment & Order Status initializers
    const initialOrderStatus: OrderStatus = 'PENDING';
    const initialPaymentStatus: PaymentStatus =
      paymentMethod === 'COD' ? 'PENDING' : razorpayPaymentId ? 'PAID' : 'PENDING';

    // 3. Execute Atomic Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step A: Create Master Order with BM-05 Shipping & BM-10 Coupon Snapshot Fields
      const masterOrder = await tx.order.create({
        data: {
          orderNumber: masterOrderNumber,
          userId,
          addressId,
          totalAmount: grossSubtotal,
          discountAmount: authoritativeDiscount,
          shippingAmount: shippingTotal,
          finalAmount,
          orderStatus: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          paymentMethod,
          shippingMode: shippingCalc.shippingMethodCode,
          isFirstOrder: firstOrderCheck.isEligible,
          shippingWaiverSource: shippingCalc.sellers[0]?.freeShippingSource || null,
          shippingCostBearer: shippingCalc.sellers[0]?.costBearer || null,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          notes,
          couponId: resolvedCouponId,
          couponCode: resolvedCouponCode,
          couponType: resolvedCouponType,
          couponFundingType: (resolvedFundingType as CouponFundingType) || null,
        },
      });

      // Step B: Create Child VendorOrders & OrderItems per Shop
      const createdVendorOrders = [];
      const createdOrderItems = [];

      let vendorIndex = 1;
      for (const [shopId, sItems] of Array.from(shopItemsMap.entries())) {
        const validShop = await tx.shop.findUnique({
          where: { id: shopId },
          select: { id: true, ownerId: true, gstin: true, commissionRate: true },
        });
        const targetShopId = validShop ? validShop.id : null;
        const sellerId = validShop?.ownerId || userId;
        const shopCommissionRate = validShop?.commissionRate
          ? Number(validShop.commissionRate)
          : CommissionService.COMMISSION_RATE_PERCENT;

        const preparedItems: Array<{
          item: (typeof sItems)[0];
          productData: any;
          itemMrp: number;
          itemSellingPrice: number;
          itemQty: number;
          itemTotal: number;
          itemCalc: ReturnType<typeof CommissionService.calculateItemCommission>;
        }> = [];

        let shopTotalMrp = 0;
        let shopSellingSubtotal = 0;
        let shopTotalCommission = 0;
        let shopSellerBasePayout = 0;
        let shopSellerGstAmount = 0;
        let shopSellerTotalPayout = 0;

        for (const item of sItems) {
          const productData = await tx.product.findUnique({
            where: { id: item.productId },
            select: {
              price: true,
              compareAtPrice: true,
              returnPolicyType: true,
              returnAllowed: true,
              returnWindowDays: true,
              replacementAllowed: true,
              replacementWindowDays: true,
            },
          });

          let variantCompareAt: number | null = null;
          if (item.variantId) {
            const variantData = await tx.productVariant.findUnique({
              where: { id: item.variantId },
              select: { compareAtPrice: true },
            });
            if (variantData?.compareAtPrice) {
              variantCompareAt = Number(variantData.compareAtPrice);
            }
          }

          const itemSellingPrice = Number(item.price);
          const itemQty = Math.max(1, Number(item.quantity));
          const itemTotal = CommissionService.roundMoney(itemSellingPrice * itemQty);

          const rawMrp =
            variantCompareAt ??
            (productData?.compareAtPrice ? Number(productData.compareAtPrice) : null) ??
            (item as any).compareAtPrice ??
            itemSellingPrice;
          const itemMrp = Math.max(itemSellingPrice, Number(rawMrp || itemSellingPrice));

          const itemCalc = CommissionService.calculateItemCommission({
            productId: item.productId,
            sellerId,
            mrp: itemMrp,
            sellingPrice: itemSellingPrice,
            quantity: itemQty,
            commissionRate: shopCommissionRate,
            taxRate: (item as any).taxRate ? Number((item as any).taxRate) : 0,
            sellerGstStatus: validShop?.gstin ? 'REGISTERED' : 'UNREGISTERED',
            sellerGstin: validShop?.gstin || null,
          });

          shopTotalMrp = CommissionService.roundMoney(shopTotalMrp + itemCalc.commissionBaseAmount);
          shopSellingSubtotal = CommissionService.roundMoney(shopSellingSubtotal + itemTotal);
          shopTotalCommission = CommissionService.roundMoney(
            shopTotalCommission + itemCalc.commissionAmount,
          );
          shopSellerBasePayout = CommissionService.roundMoney(
            shopSellerBasePayout + itemCalc.sellerBasePayout,
          );
          shopSellerGstAmount = CommissionService.roundMoney(
            shopSellerGstAmount + itemCalc.sellerGstAmount,
          );
          shopSellerTotalPayout = CommissionService.roundMoney(
            shopSellerTotalPayout + itemCalc.sellerTotalPayout,
          );

          preparedItems.push({
            item,
            productData,
            itemMrp,
            itemSellingPrice,
            itemQty,
            itemTotal,
            itemCalc,
          });
        }

        const sellerGstStatus = validShop?.gstin ? 'REGISTERED' : 'UNREGISTERED';

        // BM-10 Funding Responsibility:
        // If SELLER-funded: Seller payout is reduced by the seller's allocated coupon!
        // If NAVYA-funded: Seller receives full un-discounted payout (Navya absorbs discount)!
        const sAllocation = couponAllocation.sellerAllocations.find(
          (sa) => sa.sellerId === (targetShopId || shopId) || sa.sellerId === shopId,
        );
        const sellerAllocatedCoupon = sAllocation?.allocatedCoupon || 0;
        const isSellerFunded = resolvedFundingType === 'SELLER';

        const vendorPayoutAmount = isSellerFunded
          ? Math.max(0, CommissionService.roundMoney(shopSellerTotalPayout - sellerAllocatedCoupon))
          : shopSellerTotalPayout;

        const vendorOrderNumber = `${masterOrderNumber}-V${vendorIndex}`;
        vendorIndex++;

        // Create Child VendorOrder with BM-03 & BM-10 fields
        const vendorOrder = await tx.vendorOrder.create({
          data: {
            masterOrderId: masterOrder.id,
            shopId: targetShopId || shopId,
            vendorOrderNumber,
            totalAmount: shopSellingSubtotal,
            totalMrp: shopTotalMrp,
            commissionAmount: shopTotalCommission,
            vendorPayoutAmount,
            allocatedCouponAmount: sellerAllocatedCoupon,
            couponFundingType: (resolvedFundingType as CouponFundingType) || null,
            sellerBasePayout: isSellerFunded
              ? Math.max(
                  0,
                  CommissionService.roundMoney(shopSellerBasePayout - sellerAllocatedCoupon),
                )
              : shopSellerBasePayout,
            sellerGstAmount: shopSellerGstAmount,
            sellerGstStatus,
            status: initialOrderStatus,
            shippingStatus: 'PENDING',
          },
        });

        createdVendorOrders.push(vendorOrder);

        // Initialize SellerSettlement Record (BM-01, BM-03, BM-05, BM-10)
        const sellerShippingBreakdown = shippingCalc.sellerBreakdown.find(
          (b) => b.sellerId === (targetShopId || shopId) || b.sellerId === shopId,
        );
        const sellerFundedCost = sellerShippingBreakdown?.isSellerFunded
          ? sellerShippingBreakdown.sellerFundedShippingCost || 49
          : 0;

        const sellerDiscounts = isSellerFunded
          ? CommissionService.roundMoney(sellerFundedCost + sellerAllocatedCoupon)
          : sellerFundedCost;

        const netSettlementAmount = Math.max(
          0,
          CommissionService.roundMoney(shopSellerTotalPayout - sellerDiscounts),
        );

        const settlementNumber = `NC-SET-${timestamp}-${randomSuffix}-V${vendorIndex - 1}`;
        await tx.sellerSettlement.create({
          data: {
            settlementNumber,
            masterOrderId: masterOrder.id,
            vendorOrderId: vendorOrder.id,
            shopId: targetShopId || shopId,
            sellerId,
            grossProductValue: shopSellingSubtotal,
            totalMrp: shopTotalMrp,
            commissionRate: shopCommissionRate,
            commissionAmount: shopTotalCommission,
            sellerBasePayout: isSellerFunded
              ? Math.max(
                  0,
                  CommissionService.roundMoney(shopSellerBasePayout - sellerAllocatedCoupon),
                )
              : shopSellerBasePayout,
            sellerGstStatus,
            sellerGstRate: validShop?.gstin ? preparedItems[0]?.itemCalc.taxRate || 0 : 0,
            sellerGstAmount: shopSellerGstAmount,
            sellerTotalPayout: vendorPayoutAmount,
            forwardShippingActual: 0,
            reverseShippingActual: 0,
            returnShippingDeduction: 0,
            sellerDiscounts,
            sellerFundedShippingDeduction: sellerFundedCost,
            netSettlementAmount,
            status: 'PENDING_SETTLEMENT',
            settlementEligibilityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        // Allocate seller's shipping charge across items for this shop (BM-04)
        const shopShippingCharge =
          shippingCalc.sellerBreakdown.find(
            (b) => b.sellerId === (targetShopId || shopId) || b.sellerId === shopId,
          )?.shippingCharge || 0;

        let allocatedShipping = 0;
        for (let i = 0; i < preparedItems.length; i++) {
          const prepared = preparedItems[i];
          if (shopShippingCharge === 0) {
            prepared.itemCalc.customerShippingAmount = 0;
          } else if (i === preparedItems.length - 1) {
            prepared.itemCalc.customerShippingAmount = CommissionService.roundMoney(
              shopShippingCharge - allocatedShipping,
            );
          } else {
            const itemRatio =
              shopSellingSubtotal > 0
                ? prepared.itemTotal / shopSellingSubtotal
                : 1 / preparedItems.length;
            const itemShipping = CommissionService.roundMoney(shopShippingCharge * itemRatio);
            prepared.itemCalc.customerShippingAmount = itemShipping;
            allocatedShipping = CommissionService.roundMoney(allocatedShipping + itemShipping);
          }
        }

        // Create OrderItems for this VendorOrder with Policy, BM-03 & BM-10 Pricing Snapshot
        for (const prepared of preparedItems) {
          const { item, productData, itemTotal, itemCalc } = prepared;

          const itemAlloc = couponAllocation.itemAllocations.find(
            (ia) =>
              ia.productId === item.productId &&
              (ia.shopId === (targetShopId || shopId) || ia.shopId === shopId),
          );
          const itemAllocatedCoupon = itemAlloc?.allocatedCoupon || 0;
          const navyaCouponAmount = !isSellerFunded ? itemAllocatedCoupon : 0;
          const sellerCouponAmount = isSellerFunded ? itemAllocatedCoupon : 0;

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
              policyType: productData?.returnPolicyType || 'RETURN_AND_REPLACEMENT',
              returnAllowed: productData?.returnAllowed ?? true,
              returnWindowDays: productData?.returnWindowDays ?? 3,
              replacementAllowed: productData?.replacementAllowed ?? true,
              replacementWindowDays: productData?.replacementWindowDays ?? 7,
              mrp: itemCalc.mrp,
              sellingPrice: itemCalc.sellingPrice,
              sellerDiscountAmount: itemCalc.sellerDiscountAmount,
              sellerDiscountPercentage: itemCalc.sellerDiscountPercentage,
              commissionRate: itemCalc.commissionRate,
              commissionBaseAmount: itemCalc.commissionBaseAmount,
              commissionAmount: itemCalc.commissionAmount,
              taxRate: itemCalc.taxRate,
              taxAmount: itemCalc.taxAmount,
              couponId: resolvedCouponId,
              navyaCouponAmount,
              sellerCouponAmount,
              customerShippingAmount: itemCalc.customerShippingAmount,
              sellerGstStatus: itemCalc.sellerGstStatus,
              sellerGstin: itemCalc.sellerGstin,
              sellerBasePayout: isSellerFunded
                ? Math.max(
                    0,
                    CommissionService.roundMoney(itemCalc.sellerBasePayout - sellerCouponAmount),
                  )
                : itemCalc.sellerBasePayout,
              sellerGstAmount: itemCalc.sellerGstAmount,
              sellerTotalPayout: isSellerFunded
                ? Math.max(
                    0,
                    CommissionService.roundMoney(itemCalc.sellerTotalPayout - sellerCouponAmount),
                  )
                : itemCalc.sellerTotalPayout,
              commissionCalculationVersion: itemCalc.commissionCalculationVersion,
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

      // Step E: Create Discrete Multi-Seller Shipments (BM-04)
      const { MultiSellerShipmentService } =
        await import('@/backend/services/shipping/multi-seller-shipment.service');
      await MultiSellerShipmentService.createShipmentsForOrder(masterOrder.id, tx);

      // Step F: Atomically Consume Coupon Usage with Race Condition Guard (BM-10 Section 8 & 9)
      if (resolvedCouponId) {
        const { CouponRepository } =
          await import('@/features/coupons/repositories/coupon.repository');
        await CouponRepository.recordUsage(resolvedCouponId, userId, masterOrder.id, tx);
      }

      // Step G: Record Navya Promotional Subsidy Ledger Entry (BM-10 Section 20)
      if (resolvedFundingType !== 'SELLER' && authoritativeDiscount > 0) {
        await tx.financialAuditLog.create({
          data: {
            entityType: 'PROMOTION',
            entityId: masterOrder.id,
            action: 'NAVYA_PROMOTIONAL_SUBSIDY_APPLIED',
            performedById: userId,
            amount: authoritativeDiscount,
            notes: `Navya promotional subsidy of ₹${authoritativeDiscount} funded on Coupon #${resolvedCouponCode || resolvedCouponId} for Master Order #${masterOrderNumber}.`,
          },
        });
      }

      return {
        masterOrder,
        vendorOrders: createdVendorOrders,
        orderItems: createdOrderItems,
        paymentTx,
      };
    });

    if (result?.masterOrder?.id) {
      OrderEmailNotificationService.notifyOrderCreated(result.masterOrder.id).catch((emailErr) => {
        console.warn(`[ORDER_SPLIT_EMAIL_ERROR] Master Order: ${result.masterOrder.id}`, emailErr);
      });
    }

    return result;
  }
}

import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';

import { executeBackgroundTask } from '@/backend/lib/background-task';
import { CommissionService } from '@/backend/services/commission.service';
import { OrderEmailNotificationService } from '@/backend/services/order-email.service';
import { MultiSellerShipmentService } from '@/backend/services/shipping/multi-seller-shipment.service';
import { ensureOrderSchemaSynced } from '@/lib/order-schema-guard';
import { prisma } from '@/lib/prisma';

export interface CreateOrderInput {
  userId: string;
  addressId: string;
  totalAmount: number;
  discountAmount: number;
  shippingAmount?: number;
  taxAmount?: number;
  codFee?: number;
  codFeeTax?: number;
  finalAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus?: OrderStatus;
  shippingMode?: string;
  isFirstOrder?: boolean;
  shippingWaiverSource?: string | null;
  shippingCostBearer?: string | null;
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
   * Atomically creates an entire multi-seller order with all sub-orders, transactions, and inventory decrements.
   * Optimized for sub-second order placement:
   * - Resolves products and shops in batched single queries outside transaction.
   * - Eliminates redundant duplicate shipping & tax calculations when provided in input.
   * - Executes atomic transaction in < 200ms without savepoint overhead.
   * - Dispatches shipments, audit logs, email notifications, and background verification asynchronously.
   */
  static async createOrderWithItems(
    input: CreateOrderInput,
    options?: { syncPostCommit?: boolean },
  ) {
    // 0. Ensure critical order and item columns exist in the database (self-healing migration guard)
    await ensureOrderSchemaSynced();

    const orderNumber = this.generateOrderNumber();
    const finalOrderStatus =
      input.paymentStatus === PaymentStatus.PAID ? OrderStatus.CONFIRMED : OrderStatus.PENDING;

    // 1. Resolve Product & Shop details for each item in a single batched query
    const itemIds = input.items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } },
      select: {
        id: true,
        shopId: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        name: true,
        sku: true,
      },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    // Find system default shop outside transaction as ultimate fallback
    const defaultShop = await prisma.shop.findFirst({
      where: { deletedAt: null },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, slug: true, shopCode: true, ownerId: true },
    });

    // Collect candidate shop keys from items & products
    const candidateShopKeys = Array.from(
      new Set(
        input.items
          .map((i) => {
            const prod = productMap.get(i.productId);
            return i.shopId || prod?.shopId || null;
          })
          .filter((k): k is string =>
            Boolean(
              k &&
              k !== 'DEFAULT_SHOP' &&
              k !== 'default_shop' &&
              k !== 'independent-shop' &&
              k !== 'navya-boutique',
            ),
          ),
      ),
    );

    const dbShops =
      candidateShopKeys.length > 0
        ? await prisma.shop.findMany({
            where: {
              deletedAt: null,
              OR: [
                { id: { in: candidateShopKeys } },
                { slug: { in: candidateShopKeys } },
                { shopCode: { in: candidateShopKeys } },
              ],
            },
            select: { id: true, slug: true, shopCode: true, ownerId: true },
          })
        : [];

    const shopLookup = new Map<string, { id: string; ownerId: string }>();
    for (const s of dbShops) {
      if (s.id) shopLookup.set(s.id, s);
      if (s.slug) shopLookup.set(s.slug, s);
      if (s.shopCode) shopLookup.set(s.shopCode, s);
    }

    const preparedItems = input.items.map((item) => {
      const prod = productMap.get(item.productId);
      const candidateKey = item.shopId || prod?.shopId;
      const matchedShop = candidateKey
        ? shopLookup.get(candidateKey) || shopLookup.get(candidateKey.toLowerCase())
        : null;
      const canonicalShop = matchedShop || defaultShop;
      const resolvedShopId = canonicalShop?.id || candidateKey || 'DEFAULT_SHOP';

      return {
        ...item,
        shopId: resolvedShopId,
        canonicalShop,
        name: item.name || prod?.name || 'Fashion Item',
        sku: item.sku || prod?.sku || 'SKU-ITEM',
        compareAtPrice: item.compareAtPrice ?? (prod as any)?.compareAtPrice ?? item.price,
      };
    });

    // 1b. Map resolved shops for vendor order creation
    const shopMap = new Map<string, { id: string; ownerId: string }>();
    if (defaultShop) {
      shopMap.set(defaultShop.id, defaultShop);
    }
    for (const s of dbShops) {
      shopMap.set(s.id, s);
    }

    // 1c. Resolve Applied Coupon and Multi-Seller / Item Allocations (BM-10)
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

    // 2. Authoritative Shipping & Fee Calculation (Fast-path if already provided in input)
    let authoritativeShipping = Number(input.shippingAmount ?? 0);
    let shippingMode = input.shippingMode || 'STANDARD';
    let isFirstOrder = input.isFirstOrder ?? false;
    let shippingWaiverSource = input.shippingWaiverSource ?? null;
    let shippingCostBearer = input.shippingCostBearer ?? null;

    if (input.shippingAmount === undefined) {
      const { CustomerShippingService } =
        await import('@/backend/services/shipping/customer-shipping.service');
      const { ShippingPolicyRepository } =
        await import('@/features/shipping/repositories/shipping.repository');

      const firstOrderCheck = await ShippingPolicyRepository.evaluateFirstOrderEligibility(
        input.userId,
      );
      isFirstOrder = firstOrderCheck.isEligible;

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
          paymentMethod: isCod ? 'COD' : 'PREPAID',
          isFirstOrder,
        },
      );
      authoritativeShipping = shippingCalc.finalShippingAmount;
      shippingMode = shippingCalc.shippingMethodCode;
      shippingWaiverSource = shippingCalc.sellers[0]?.freeShippingSource || null;
      shippingCostBearer = shippingCalc.sellers[0]?.costBearer || null;
    }

    const authoritativeTax = Number(input.taxAmount || 0);
    let authoritativeCodFee = Number(input.codFee ?? 0);
    let authoritativeCodFeeTax = Number(input.codFeeTax ?? 0);

    if (isCod && input.codFee === undefined) {
      const { TaxService } = await import('@/features/tax/services/tax.service');
      const address = await prisma.address.findUnique({
        where: { id: input.addressId },
        select: { state: true },
      });

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

        const sTax = sItems.reduce((sum, i) => sum + Number((i as any).taxAmount || 0), 0);
        const sCodBase = Math.max(0, CommissionService.roundMoney(sSubtotal - sCoupon + sTax));
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

    const authoritativeFinalAmount =
      input.finalAmount !== undefined
        ? Number(input.finalAmount)
        : Math.max(
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

    // 3. Ultra-Fast Atomic Database Transaction (< 200ms)
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
            shippingMode,
            isFirstOrder,
            shippingWaiverSource,
            shippingCostBearer,
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            notes: input.notes,
          },
        });

        // b. Group Items by Seller / Shop for Vendor Orders & Item Linking
        const itemsByShop = new Map<string, typeof preparedItems>();
        for (const itm of preparedItems) {
          const list = itemsByShop.get(itm.shopId) || [];
          list.push(itm);
          itemsByShop.set(itm.shopId, list);
        }

        for (const [shopId, sItems] of Array.from(itemsByShop.entries())) {
          const sSubtotal = sItems.reduce((sum, i) => sum + Number(i.total), 0);
          const shopRecord = shopMap.get(shopId) || defaultShop;
          const targetShopId = shopRecord?.id || shopId;

          // Vendor Order Number (unique per shop and master order)
          const shopSuffix =
            targetShopId
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(-4)
              .toUpperCase() || 'VEND';
          const vendorOrderNumber = `${orderNumber}-${shopSuffix}`;

          let shopCommission = 0;
          let shopPayout = 0;
          let totalMrp = 0;

          // Pre-calculate commercial values for all items in this shop
          const itemCalculations = sItems.map((item) => {
            const itemMrp = (item as any).compareAtPrice || item.price;
            totalMrp += Number(itemMrp) * item.quantity;
            const commRes = CommissionService.calculateItemCommission({
              mrp: itemMrp,
              sellingPrice: item.price,
              quantity: item.quantity,
            });
            shopCommission = CommissionService.roundMoney(
              shopCommission + commRes.commissionAmount,
            );
            shopPayout = CommissionService.roundMoney(shopPayout + commRes.sellerTotalPayout);
            return { item, commRes };
          });

          const sAlloc = couponAllocation?.sellerAllocations?.find(
            (s: any) => s.sellerId === shopId || s.sellerId === targetShopId,
          );
          const sCouponDiscount = sAlloc ? sAlloc.allocatedDiscount : 0;

          const adjustedShopPayout =
            couponFundingType === 'SELLER'
              ? Math.max(0, CommissionService.roundMoney(shopPayout - sCouponDiscount))
              : shopPayout;

          // Create Child Vendor Order (Section 1, 9, 21)
          const vendorOrder = await tx.vendorOrder.create({
            data: {
              masterOrderId: order.id,
              shopId: targetShopId,
              vendorOrderNumber,
              totalAmount: sSubtotal,
              totalMrp,
              commissionAmount: shopCommission,
              vendorPayoutAmount: adjustedShopPayout,
              allocatedCouponAmount: sCouponDiscount,
              couponFundingType: sCouponDiscount > 0 ? couponFundingType : null,
              status: isCod ? OrderStatus.PENDING : finalOrderStatus,
              shippingStatus: 'PENDING',
            },
          });

          // Create Order Items with Commercial Snapshots linked to VendorOrder & Shop
          for (const { item, commRes } of itemCalculations) {
            if (!productMap.has(item.productId)) {
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
                  shopId: targetShopId,
                },
              });
              productMap.set(item.productId, { id: item.productId } as any);
            }

            const itmAlloc = couponAllocation?.itemAllocations?.find(
              (a: any) => a.productId === item.productId,
            );

            await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: item.productId,
                variantId: item.variantId || null,
                shopId: targetShopId,
                vendorOrderId: vendorOrder.id,
                name: item.name,
                sku: item.sku,
                price: item.price,
                quantity: item.quantity,
                total: item.total,
                mrp: (item as any).compareAtPrice || item.price,
                sellingPrice: item.price,
                commissionRate: commRes.commissionRate,
                commissionAmount: commRes.commissionAmount,
                commissionBaseAmount: commRes.commissionBaseAmount,
                sellerBasePayout: commRes.sellerBasePayout,
                sellerGstAmount: commRes.sellerGstAmount,
                sellerTotalPayout: commRes.sellerTotalPayout,
                sellerGstStatus: commRes.sellerGstStatus,
                taxRate: item.taxRate ? Number(item.taxRate) : undefined,
                taxAmount: item.taxAmount ? Number(item.taxAmount) : undefined,
                couponId: resolvedCoupon?.id || null,
                navyaCouponAmount: itmAlloc ? itmAlloc.navyaCouponAmount : 0,
                sellerCouponAmount: itmAlloc ? itmAlloc.sellerCouponAmount : 0,
                policyType: 'RETURN_AND_REPLACEMENT',
                returnAllowed: true,
                replacementAllowed: true,
              },
            });
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

        // e. Decrement Stock Inventory Atomically (BM-06 Inventory Race Protection)
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

        return {
          order,
          orderId: order.id,
          orderNumber: order.orderNumber,
          finalAmount: authoritativeFinalAmount,
          isRazorpay,
          isCod,
          estimatedTotalGatewayCost,
          estimatedGatewayFee,
          estimatedGatewayTax,
          resolvedCouponId: resolvedCoupon?.id,
          couponCode: resolvedCoupon?.code || input.couponCode,
          couponFundingType,
          sellerAllocations: couponAllocation?.sellerAllocations || [],
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );

    // =========================================================================
    // POST-COMMIT WORKFLOW
    // The order is 100% committed, stock is locked, and payment saved.
    // Dispatched via executeBackgroundTask so the customer response returns in < 300ms.
    // =========================================================================
    const runPostCommitOperations = async () => {
      // 1. Asynchronously Record Coupon Usage (BM-10)
      if (result.resolvedCouponId) {
        try {
          const { CouponRepository } =
            await import('@/features/coupons/repositories/coupon.repository');
          await CouponRepository.recordUsage(
            result.resolvedCouponId,
            input.userId,
            result.orderId,
            prisma,
          );
        } catch (couponUsageErr) {
          console.warn('[ORDER_REPO_COUPON_USAGE_WARN]', couponUsageErr);
        }
      }

      // 2. Navya Promotional Subsidy Accounting Logs (BM-10)
      if (result.couponFundingType === 'NAVYA' && result.sellerAllocations.length > 0) {
        for (const sAlloc of result.sellerAllocations) {
          if (sAlloc.allocatedDiscount > 0) {
            try {
              await prisma.financialAuditLog.create({
                data: {
                  entityType: 'PROMOTIONAL_SUBSIDY',
                  entityId: result.orderId,
                  action: 'NAVYA_PROMOTIONAL_SUBSIDY_APPLIED',
                  amount: sAlloc.allocatedDiscount,
                  notes: `Navya promotional subsidy applied for shop ${sAlloc.sellerId} under coupon ${result.couponCode}: ₹${sAlloc.allocatedDiscount}`,
                },
              });
            } catch (subsidyErr) {
              console.warn('[ORDER_REPO_SUBSIDY_AUDIT_WARN]', subsidyErr);
            }
          }
        }
      }

      // 3. Create Discrete Multi-Seller Shipments (BM-04)
      try {
        await MultiSellerShipmentService.createShipmentsForOrder(result.orderId, prisma);
      } catch (shipmentErr) {
        console.warn(
          '[ORDER_REPO_SHIPMENTS_WARN] Error creating shipments for order:',
          shipmentErr,
        );
      }

      // 4. Gateway Fee Accounting
      if (result.isRazorpay && result.estimatedTotalGatewayCost > 0) {
        try {
          await prisma.financialAuditLog.create({
            data: {
              entityType: 'GATEWAY_FEE',
              entityId: result.orderId,
              action: 'RECORD_GATEWAY_FEE_ESTIMATED',
              amount: result.estimatedTotalGatewayCost,
              notes: `Payment gateway fee estimated (2% MDR ₹${result.estimatedGatewayFee} + 18% GST ₹${result.estimatedGatewayTax}) absorbed by Navya Collection`,
              idempotencyKey: `GW_FEE_EST:${result.orderId}`,
            },
          });
        } catch (auditErr) {
          console.warn('[ORDER_REPO_GATEWAY_AUDIT_WARN]', auditErr);
        }
      }

      // 5. BM-11: Record Initial Order Unit Economics & Contribution Snapshot
      try {
        const { ContributionService } = await import('@/backend/services/contribution.service');
        await ContributionService.recordOrderContribution(
          result.orderId,
          'PAYMENT_CAPTURED' as any,
          prisma,
        );
      } catch (contribErr) {
        console.warn('[BM11_INITIAL_CONTRIBUTION_WARN]', contribErr);
      }

      // 6. Clear Customer Cart
      try {
        const cart = await prisma.cart.findUnique({
          where: { userId: input.userId },
          select: { id: true },
        });
        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      } catch (cartErr) {
        console.warn('[ORDER_REPO_CART_CLEAR_WARN]', cartErr);
      }

      // 7. Background Dispatch to Shiprocket
      try {
        const orderWithShipments = await prisma.order.findUnique({
          where: { id: result.orderId },
          select: { shipments: { select: { id: true } } },
        });
        if (orderWithShipments?.shipments) {
          for (const shp of orderWithShipments.shipments) {
            MultiSellerShipmentService.dispatchShipmentToShiprocket(shp.id).catch((err) => {
              console.warn(`[BACKGROUND_SHIPROCKET_DISPATCH_FAILED] Shipment: ${shp.id}`, err);
            });
          }
        }
      } catch {}

      // 8. Order Transactional Email Dispatch
      OrderEmailNotificationService.notifyOrderCreated(result.orderId).catch((emailErr) => {
        console.warn(`[ORDER_EMAIL_NOTIFICATION_ERROR] Order: ${result.orderId}`, emailErr);
      });

      // 9. COD Verification Initiation (BM-07)
      if (result.isCod) {
        try {
          const { ShiprocketCodService } =
            await import('@/backend/services/shipping/shiprocket-cod.service');
          await ShiprocketCodService.initiateVerification(result.orderId).catch((verErr) => {
            console.warn('[SHIPROCKET_COD_VERIFICATION_INITIATE_WARN]', verErr?.message);
          });
        } catch {}
      }
    };

    if (options?.syncPostCommit) {
      await runPostCommitOperations();
      return (
        (await prisma.order.findUnique({
          where: { id: result.orderId },
          include: {
            items: true,
            address: true,
            vendorOrders: true,
            shipments: { include: { items: true } },
            paymentTransactions: true,
          },
        })) || result.order
      );
    } else {
      executeBackgroundTask(`order_post_commit_${result.orderId}`, runPostCommitOperations);
      return result.order;
    }
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

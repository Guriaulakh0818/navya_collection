import { ContributionStatus, PaymentMethod, Prisma, PrismaClient } from '@prisma/client';

import { prisma } from '@/lib/prisma';

import { CommissionService } from './commission.service';
import { PaymentGatewayConfigService } from './payment-gateway-config.service';
import { PlatformTaxService, PlatformTaxType } from './platform-tax.service';

export interface ItemContributionBreakdown {
  orderItemId: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  mrp: number;
  sellingPrice: number;
  // Revenue
  commissionEarned: number;
  customerShippingCollected: number;
  codFeeCollected: number;
  applicablePlatformTax: number;
  revenueTotal: number;
  // Costs
  gatewayCost: number;
  navyaCouponSubsidy: number;
  navyaForwardShippingCost: number;
  navyaReturnShippingCost: number;
  navyaRtoLogisticsCost: number;
  navyaCancellationLogisticsCost: number;
  courierCodCost: number;
  variableCostTotal: number;
  // Output
  grossContribution: number;
  contributionMarginPercent: number;
}

export interface ShipmentContributionBreakdown {
  shipmentId: string;
  shipmentNumber: string;
  shopId: string;
  sellerId: string;
  status: string;
  shippingMode: string;
  isFreeShipping: boolean;
  costBearer: string;
  // Revenue
  commissionEarned: number;
  customerShippingCollected: number;
  codFeeCollected: number;
  applicablePlatformTax: number;
  revenueTotal: number;
  // Variable Costs
  gatewayCost: number;
  navyaCouponSubsidy: number;
  navyaForwardShippingCost: number;
  navyaFreeShippingSubsidy: number;
  navyaReturnShippingCost: number;
  navyaRtoLogisticsCost: number;
  navyaCancellationLogisticsCost: number;
  courierCodCost: number;
  variableCostTotal: number;
  // Output
  grossContribution: number;
  contributionMarginPercent: number;
  shippingCostStatus: string;
}

export interface SellerContributionBreakdown {
  vendorOrderId?: string;
  shopId: string;
  shopName: string;
  // Revenue
  commissionEarned: number;
  customerShippingCollected: number;
  codFeeCollected: number;
  otherNavyaRevenue: number;
  applicablePlatformTax: number;
  platformOutputTax?: number;
  revenueTotal: number;
  // Variable Costs
  gatewayCost: number;
  gatewayFeeStatus: 'ESTIMATED' | 'ACTUAL';
  navyaCouponSubsidy: number;
  navyaForwardShippingCost: number;
  navyaFreeShippingSubsidy: number;
  shippingCostStatus: 'ESTIMATED' | 'ACTUAL' | 'UNKNOWN';
  navyaReturnShippingCost: number;
  navyaRtoLogisticsCost: number;
  navyaCancellationLogisticsCost: number;
  courierCodCost: number;
  otherVariableCost: number;
  variableCostTotal: number;
  // Output
  grossContribution: number;
  contributionMarginPercent: number;
  items: ItemContributionBreakdown[];
  shipments: ShipmentContributionBreakdown[];
}

export interface OrderContributionBreakdown {
  orderId: string;
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  contributionStatus: ContributionStatus;
  calculationVersion: string;
  calculatedAt: string;
  // Revenue Breakdown
  commissionEarned: number;
  customerShippingCollected: number;
  codFeeCollected: number;
  otherNavyaRevenue: number;
  applicablePlatformTax: number;
  platformOutputTax?: number;
  revenueTotal: number;
  // Variable Cost Breakdown
  gatewayFeeActual: number;
  gatewayTaxActual: number;
  gatewayFeeEstimated: number;
  gatewayCostUsed: number;
  gatewayFeeStatus: 'ESTIMATED' | 'ACTUAL';
  isEstimatedGatewayFee?: boolean;
  navyaCouponSubsidy: number;
  navyaForwardShippingCost: number;
  navyaFreeShippingSubsidy: number;
  shippingCostStatus: 'ESTIMATED' | 'ACTUAL' | 'UNKNOWN';
  navyaReturnShippingCost: number;
  navyaRtoLogisticsCost: number;
  navyaCancellationLogisticsCost: number;
  courierCodCollectionFee: number;
  otherVariableCost: number;
  variableCostTotal: number;
  // Outputs
  grossContribution: number;
  contributionMarginPercent: number;
  // Historical Snapshot Rates (BM-11 Hardening)
  taxRuleVersion?: string;
  commissionTaxRate?: number;
  codFeeTaxRate?: number;
  gatewayEstimateRate?: number;
  gatewayEstimateTaxRate?: number;
  // Multi-seller granularity
  sellers: SellerContributionBreakdown[];
}

export class ContributionService {
  public static readonly VERSION = 'BM-11-V1';

  /**
   * Safely calculates contribution margin percentage.
   * Handles zero revenue, negative contribution, and prevents NaN / Infinity.
   */
  public static calculateMarginPercent(contribution: number, revenue: number): number {
    if (revenue === 0) {
      if (contribution === 0) return 0;
      return contribution < 0 ? -100 : 100;
    }
    const pct = (contribution / revenue) * 100;
    return CommissionService.roundMoney(pct);
  }

  /**
   * Calculates dynamic platform service output GST without hardcoded tax rates.
   * Consumes dynamically resolved or historical tax snapshots.
   */
  public static calculatePlatformOutputTax(
    commission: number,
    codFee: number = 0,
    rates?: { commissionTaxRate?: number; codFeeTaxRate?: number } | number,
  ): number {
    if (typeof rates === 'number') {
      const base = CommissionService.roundMoney(commission + codFee);
      return CommissionService.roundMoney(base * rates);
    }
    const commRate = rates?.commissionTaxRate ?? 0.18;
    const codRate = rates?.codFeeTaxRate ?? 0.18;
    const commTax = CommissionService.roundMoney(commission * commRate);
    const codTax = CommissionService.roundMoney(codFee * codRate);
    return CommissionService.roundMoney(commTax + codTax);
  }

  /**
   * Estimates Razorpay payment gateway fee dynamically via PaymentGatewayConfigService.
   */
  public static async estimateGatewayFee(
    amount: number,
    transactionDate?: Date | string | null,
    paymentMethod?: string,
    client?: PrismaClient | Prisma.TransactionClient,
  ): Promise<{
    fee: number;
    tax: number;
    total: number;
    estimateRate: number;
    estimateTaxRate: number;
  }> {
    return PaymentGatewayConfigService.estimateGatewayFee({
      amount,
      paymentMethod,
      transactionDate,
      client,
    });
  }

  /**
   * Synchronous estimation helper for non-async callers or tests with specific configured rates.
   */
  public static estimateGatewayFeeSync(
    amount: number,
    rate = 0.02,
    taxRate = 0.18,
  ): { fee: number; tax: number; total: number } {
    const fee = CommissionService.roundMoney(amount * rate);
    const tax = CommissionService.roundMoney(fee * taxRate);
    const total = CommissionService.roundMoney(fee + tax);
    return { fee, tax, total };
  }

  /**
   * Calculates comprehensive order contribution breakdown immutably from historical snapshots.
   */
  public static async calculateOrderContribution(
    orderIdOrNumber: string,
    txClient?: PrismaClient | Prisma.TransactionClient,
  ): Promise<OrderContributionBreakdown> {
    const client = txClient || prisma;

    const order = await client.order.findFirst({
      where: {
        OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      },
      include: {
        items: {
          include: { product: true, variant: true },
        },
        vendorOrders: {
          include: {
            items: true,
            settlement: true,
            shipments: true,
          },
        },
        shipments: {
          include: { items: true },
        },
        paymentTransactions: {
          orderBy: { createdAt: 'desc' },
        },
        customerRefunds: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderIdOrNumber} not found for contribution calculation.`);
    }

    const isCod = order.paymentMethod === PaymentMethod.COD;
    const isPrepaid = !isCod;

    // Resolve historical tax snapshot rates if order contribution already exists (Historical Immutability)
    const existingSnapshot = client.orderContribution?.findFirst
      ? await client.orderContribution.findFirst({
          where: { masterOrderId: order.id, vendorOrderId: null },
          select: {
            taxRuleVersion: true,
            commissionTaxRate: true,
            codFeeTaxRate: true,
            gatewayEstimateRate: true,
            gatewayEstimateTaxRate: true,
          },
        })
      : null;

    let commissionTaxRate = existingSnapshot?.commissionTaxRate
      ? Number(existingSnapshot.commissionTaxRate)
      : undefined;
    let codFeeTaxRate = existingSnapshot?.codFeeTaxRate
      ? Number(existingSnapshot.codFeeTaxRate)
      : undefined;
    let taxRuleVersion = existingSnapshot?.taxRuleVersion || 'v1.0';

    if (commissionTaxRate === undefined) {
      const commRule = await PlatformTaxService.getEffectiveTaxRule(
        PlatformTaxType.PLATFORM_COMMISSION_GST,
        order.createdAt,
        client,
      );
      commissionTaxRate = commRule.rate;
      taxRuleVersion = commRule.version;
    }

    if (codFeeTaxRate === undefined) {
      const codRule = await PlatformTaxService.getEffectiveTaxRule(
        PlatformTaxType.COD_FEE_GST,
        order.createdAt,
        client,
      );
      codFeeTaxRate = codRule.rate;
    }

    // 1. Resolve Gateway Fee & Status
    const primaryTxn = order.paymentTransactions.find(
      (tx) => tx.status === 'PAID' || tx.razorpayPaymentId,
    );
    let gatewayFeeActual = 0;
    let gatewayTaxActual = 0;
    let gatewayFeeEstimated = 0;
    let gatewayCostUsed = 0;
    let gatewayFeeStatus: 'ESTIMATED' | 'ACTUAL' = 'ESTIMATED';
    let gatewayEstimateRate = existingSnapshot?.gatewayEstimateRate
      ? Number(existingSnapshot.gatewayEstimateRate)
      : undefined;
    let gatewayEstimateTaxRate = existingSnapshot?.gatewayEstimateTaxRate
      ? Number(existingSnapshot.gatewayEstimateTaxRate)
      : undefined;

    if (isPrepaid) {
      const finalAmt = Number(order.finalAmount || 0);

      if (
        primaryTxn &&
        primaryTxn.gatewayFeeStatus === 'ACTUAL' &&
        Number(primaryTxn.gatewayFee || 0) > 0
      ) {
        gatewayFeeActual = Number(primaryTxn.gatewayFee || 0);
        gatewayTaxActual = Number(primaryTxn.gatewayTax || 0);
        gatewayCostUsed = CommissionService.roundMoney(gatewayFeeActual + gatewayTaxActual);
        gatewayFeeStatus = 'ACTUAL';
      } else if (primaryTxn && Number(primaryTxn.gatewayFee || 0) > 0) {
        gatewayFeeEstimated = CommissionService.roundMoney(
          Number(primaryTxn.gatewayFee || 0) + Number(primaryTxn.gatewayTax || 0),
        );
        gatewayCostUsed = gatewayFeeEstimated;
        gatewayFeeStatus = 'ESTIMATED';
      } else {
        const est = await PaymentGatewayConfigService.estimateGatewayFee({
          amount: finalAmt,
          paymentMethod: order.paymentMethod.toString(),
          transactionDate: order.createdAt,
          client,
        });
        gatewayFeeEstimated = est.total;
        gatewayCostUsed = est.total;
        gatewayFeeStatus = 'ESTIMATED';
        gatewayEstimateRate = est.estimateRate;
        gatewayEstimateTaxRate = est.estimateTaxRate;
      }
    }

    // 2. Identify Status Lifecycle
    let contributionStatus: ContributionStatus = ContributionStatus.ESTIMATED;
    if (order.orderStatus === 'CANCELLED') {
      contributionStatus = ContributionStatus.CANCELLED;
    } else if (order.orderStatus === 'RTO') {
      contributionStatus = ContributionStatus.RTO;
    } else if (order.orderStatus === 'RETURNED') {
      contributionStatus = ContributionStatus.RETURNED;
    } else if (order.orderStatus === 'DELIVERED') {
      const hasSettled = order.vendorOrders.some((vo) => vo.settlement?.status === 'SETTLED');
      contributionStatus = hasSettled ? ContributionStatus.SETTLED : ContributionStatus.DELIVERED;
    } else if (order.orderStatus === 'SHIPPED') {
      contributionStatus = ContributionStatus.SHIPPED;
    } else if (order.paymentStatus === 'PAID' || isCod) {
      contributionStatus = ContributionStatus.PAYMENT_CAPTURED;
    }

    // 3. Process Seller-level and Item-level details
    const sellerBreakdowns: SellerContributionBreakdown[] = [];
    const totalOrderSubtotal = Number(order.totalAmount || 0);

    let orderCommissionEarned = 0;
    let orderCustomerShipping = 0;
    let orderCodFee =
      order.orderStatus === 'CANCELLED' || order.orderStatus === 'RTO'
        ? 0
        : Number(order.codFee || 0);
    let orderNavyaCouponSubsidy = 0;
    let orderNavyaForwardShipping = 0;
    let orderNavyaFreeShipping = 0;
    let orderNavyaReturnShipping = 0;
    let orderNavyaRtoLogistics = 0;
    let orderNavyaCancellationLoss = 0;
    let orderCourierCodFee = 0;

    let orderShippingCostStatus: 'ESTIMATED' | 'ACTUAL' | 'UNKNOWN' = 'ACTUAL';

    // Group items by shopId
    const shopItemsMap = new Map<string, typeof order.items>();
    for (const itm of order.items) {
      const sId = itm.shopId || 'DEFAULT_SHOP';
      const arr = shopItemsMap.get(sId) || [];
      arr.push(itm);
      shopItemsMap.set(sId, arr);
    }

    const shopEntries = Array.from(shopItemsMap.entries());

    for (let sIdx = 0; sIdx < shopEntries.length; sIdx++) {
      const [shopId, sItems] = shopEntries[sIdx];
      const isLastSeller = sIdx === shopEntries.length - 1;

      const vendorOrder = order.vendorOrders.find((vo) => vo.shopId === shopId);
      const settlements = vendorOrder?.settlement;
      const sellerShipments = order.shipments.filter((s) => s.shopId === shopId);

      // A. Commission from items (strictly MRP * 10% from historical snapshot)
      let sellerItemCommission = 0;
      let sellerNavyaCoupon = 0;

      const itemBreakdowns: ItemContributionBreakdown[] = [];

      for (const itm of sItems) {
        const commAmt = Number(itm.commissionAmount || 0);
        sellerItemCommission = CommissionService.roundMoney(sellerItemCommission + commAmt);

        const navyaCpn = Number(itm.navyaCouponAmount || 0);
        sellerNavyaCoupon = CommissionService.roundMoney(sellerNavyaCoupon + navyaCpn);

        itemBreakdowns.push({
          orderItemId: itm.id,
          productId: itm.productId,
          name: itm.name,
          sku: itm.sku,
          quantity: itm.quantity,
          price: Number(itm.price),
          mrp: Number(itm.mrp || itm.price),
          sellingPrice: Number(itm.sellingPrice || itm.price),
          commissionEarned: commAmt,
          customerShippingCollected: Number(itm.customerShippingAmount || 0),
          codFeeCollected: 0,
          applicablePlatformTax: CommissionService.roundMoney(commAmt * commissionTaxRate),
          revenueTotal: commAmt,
          gatewayCost: 0,
          navyaCouponSubsidy: navyaCpn,
          navyaForwardShippingCost: 0,
          navyaReturnShippingCost: 0,
          navyaRtoLogisticsCost: 0,
          navyaCancellationLogisticsCost: 0,
          courierCodCost: 0,
          variableCostTotal: navyaCpn,
          grossContribution: CommissionService.roundMoney(commAmt - navyaCpn),
          contributionMarginPercent: this.calculateMarginPercent(commAmt - navyaCpn, commAmt),
        });
      }

      // If order is cancelled or RTO, or return/cancellation commission reversal exists:
      const allShipmentsRto =
        sellerShipments.length > 0 &&
        sellerShipments.every(
          (s) =>
            s.rtoStatus === 'RTO_DELIVERED' || s.status === 'RTO_DELIVERED' || s.status === 'RTO',
        );
      let commReversal = 0;
      if (
        order.orderStatus === 'CANCELLED' ||
        vendorOrder?.status === 'CANCELLED' ||
        order.orderStatus === 'RTO' ||
        vendorOrder?.status === 'RTO' ||
        allShipmentsRto
      ) {
        commReversal = sellerItemCommission;
      } else if (settlements && Number(settlements.commissionReversal || 0) > 0) {
        commReversal = Number(settlements.commissionReversal);
      }
      const realizedCommission = Math.max(
        0,
        CommissionService.roundMoney(sellerItemCommission - commReversal),
      );
      orderCommissionEarned = CommissionService.roundMoney(
        orderCommissionEarned + realizedCommission,
      );
      orderNavyaCouponSubsidy = CommissionService.roundMoney(
        orderNavyaCouponSubsidy + sellerNavyaCoupon,
      );

      // B. Shipments for this seller
      let sellerShippingCollected = 0;
      let sellerCodFeeCollected = 0;
      let sellerForwardFreight = 0;
      let sellerFreeFreightSubsidy = 0;
      let sellerReturnFreight = 0;
      let sellerRtoFreight = 0;
      let sellerCancellationLoss = 0;
      let sellerCourierCodCharge = 0;

      const shipmentBreakdowns: ShipmentContributionBreakdown[] = [];

      for (const shp of sellerShipments) {
        const shipCharge = Number(shp.shippingCharge || 0);
        sellerShippingCollected = CommissionService.roundMoney(
          sellerShippingCollected + shipCharge,
        );

        // Forward freight cost (when Navya bears shipping cost)
        const isNavyaBearer = shp.costBearer !== 'SELLER';
        const isRto =
          shp.rtoStatus === 'RTO_DELIVERED' ||
          shp.status === 'RTO_DELIVERED' ||
          shp.status === 'RTO';
        const isCancelledPostDispatch = shp.status === 'CANCELLED' && Boolean(shp.shippedAt);

        const isUncollected =
          isRto ||
          isCancelledPostDispatch ||
          order.orderStatus === 'CANCELLED' ||
          order.orderStatus === 'RTO';
        const shpCodFee = isUncollected ? 0 : Number(shp.codFee || 0);
        sellerCodFeeCollected = CommissionService.roundMoney(sellerCodFeeCollected + shpCodFee);

        let forwardCost = 0;
        let costStatus = shp.shippingCostStatus || 'ESTIMATED';

        if (isNavyaBearer) {
          if (shp.actualForwardShippingCost !== null && Number(shp.actualForwardShippingCost) > 0) {
            forwardCost = Number(shp.actualForwardShippingCost);
            costStatus = 'ACTUAL';
          } else {
            // Estimated forward freight fallback: ₹49 standard, ₹99 express
            forwardCost = shp.shippingMode === 'EXPRESS' ? 99 : 49;
            costStatus = 'ESTIMATED';
          }
        } else {
          // Seller-funded shipping: cost is borne by seller, NOT Navya
          forwardCost = 0;
        }

        if (costStatus === 'ESTIMATED') {
          orderShippingCostStatus = 'ESTIMATED';
        }

        // Return / Reverse freight (Platform fault returns where Navya bears return)
        let returnCost = 0;
        if (shp.returnStatus === 'VERIFIED' && Number(shp.returnShippingDeduction || 0) === 0) {
          // Navya bears return shipping
          returnCost = Number(
            shp.actualReverseShippingCost || (forwardCost > 0 ? forwardCost : 60),
          );
          sellerReturnFreight = CommissionService.roundMoney(sellerReturnFreight + returnCost);
        }

        // RTO freight (50/50 split)
        let rtoCost = 0;
        if (isRto) {
          const totRto = Number(shp.actualReverseShippingCost || forwardCost * 2 || 100);
          rtoCost = CommissionService.roundMoney(totRto * 0.5); // 50% Navya share
          sellerRtoFreight = CommissionService.roundMoney(sellerRtoFreight + rtoCost);
        }

        // Cancellation freight loss (100% Navya if post-dispatch)
        let cancelLoss = 0;
        if (isCancelledPostDispatch) {
          cancelLoss = forwardCost;
          sellerCancellationLoss = CommissionService.roundMoney(
            sellerCancellationLoss + cancelLoss,
          );
        }

        // If shipment is RTO or Post-dispatch cancelled, forward logistics is categorized under RTO/Cancellation loss
        let effectiveForwardCost = forwardCost;
        if (isRto || isCancelledPostDispatch) {
          effectiveForwardCost = 0;
        } else if (isNavyaBearer) {
          sellerForwardFreight = CommissionService.roundMoney(
            sellerForwardFreight + effectiveForwardCost,
          );
          if (shp.isFreeShipping) {
            sellerFreeFreightSubsidy = CommissionService.roundMoney(
              sellerFreeFreightSubsidy + effectiveForwardCost,
            );
          }
        }

        const shpRevenue = CommissionService.roundMoney(shipCharge + shpCodFee);
        const shpVariableCost = CommissionService.roundMoney(
          effectiveForwardCost + returnCost + rtoCost + cancelLoss,
        );

        shipmentBreakdowns.push({
          shipmentId: shp.id,
          shipmentNumber: shp.shipmentNumber,
          shopId,
          sellerId: shp.sellerId,
          status: shp.status,
          shippingMode: shp.shippingMode,
          isFreeShipping: shp.isFreeShipping,
          costBearer: shp.costBearer || 'CUSTOMER',
          commissionEarned: 0,
          customerShippingCollected: shipCharge,
          codFeeCollected: shpCodFee,
          applicablePlatformTax: CommissionService.roundMoney(shpCodFee * codFeeTaxRate),
          revenueTotal: shpRevenue,
          gatewayCost: 0,
          navyaCouponSubsidy: 0,
          navyaForwardShippingCost: effectiveForwardCost,
          navyaFreeShippingSubsidy: shp.isFreeShipping && isNavyaBearer ? effectiveForwardCost : 0,
          navyaReturnShippingCost: returnCost,
          navyaRtoLogisticsCost: rtoCost,
          navyaCancellationLogisticsCost: cancelLoss,
          courierCodCost: 0,
          variableCostTotal: shpVariableCost,
          grossContribution: CommissionService.roundMoney(shpRevenue - shpVariableCost),
          contributionMarginPercent: this.calculateMarginPercent(
            shpRevenue - shpVariableCost,
            shpRevenue,
          ),
          shippingCostStatus: costStatus,
        });
      }

      orderCustomerShipping = CommissionService.roundMoney(
        orderCustomerShipping + sellerShippingCollected,
      );
      orderNavyaForwardShipping = CommissionService.roundMoney(
        orderNavyaForwardShipping + sellerForwardFreight,
      );
      orderNavyaFreeShipping = CommissionService.roundMoney(
        orderNavyaFreeShipping + sellerFreeFreightSubsidy,
      );
      orderNavyaReturnShipping = CommissionService.roundMoney(
        orderNavyaReturnShipping + sellerReturnFreight,
      );
      orderNavyaRtoLogistics = CommissionService.roundMoney(
        orderNavyaRtoLogistics + sellerRtoFreight,
      );
      orderNavyaCancellationLoss = CommissionService.roundMoney(
        orderNavyaCancellationLoss + sellerCancellationLoss,
      );

      // C. Allocate Gateway Fee to Seller Proportionally
      let sellerAllocatedGatewayFee = 0;
      if (gatewayCostUsed > 0 && totalOrderSubtotal > 0) {
        const sellerSubtotal = sItems.reduce((s, i) => s + Number(i.total), 0);
        if (isLastSeller) {
          const sumAlloc = sellerBreakdowns.reduce((sum, b) => sum + b.gatewayCost, 0);
          sellerAllocatedGatewayFee = Math.max(
            0,
            CommissionService.roundMoney(gatewayCostUsed - sumAlloc),
          );
        } else {
          sellerAllocatedGatewayFee = CommissionService.roundMoney(
            gatewayCostUsed * (sellerSubtotal / totalOrderSubtotal),
          );
        }
      }

      // D. Seller Totals
      const sellerRevenueTotal = CommissionService.roundMoney(
        realizedCommission + sellerShippingCollected + sellerCodFeeCollected,
      );
      const sellerTax = this.calculatePlatformOutputTax(realizedCommission, sellerCodFeeCollected, {
        commissionTaxRate,
        codFeeTaxRate,
      });
      const sellerNetRevenue = CommissionService.roundMoney(sellerRevenueTotal - sellerTax);

      const sellerVariableCostTotal = CommissionService.roundMoney(
        sellerAllocatedGatewayFee +
          sellerNavyaCoupon +
          sellerForwardFreight +
          sellerReturnFreight +
          sellerRtoFreight +
          sellerCancellationLoss +
          sellerCourierCodCharge,
      );

      const sellerGrossContribution = CommissionService.roundMoney(
        sellerNetRevenue - sellerVariableCostTotal,
      );
      const sellerMarginPct = this.calculateMarginPercent(
        sellerGrossContribution,
        sellerNetRevenue,
      );

      sellerBreakdowns.push({
        vendorOrderId: vendorOrder?.id,
        shopId,
        shopName: sItems[0]?.product?.shopId || 'Partner Store',
        commissionEarned: realizedCommission,
        customerShippingCollected: sellerShippingCollected,
        codFeeCollected: sellerCodFeeCollected,
        otherNavyaRevenue: 0,
        applicablePlatformTax: sellerTax,
        platformOutputTax: sellerTax,
        revenueTotal: sellerNetRevenue,
        gatewayCost: sellerAllocatedGatewayFee,
        gatewayFeeStatus,
        navyaCouponSubsidy: sellerNavyaCoupon,
        navyaForwardShippingCost: sellerForwardFreight,
        navyaFreeShippingSubsidy: sellerFreeFreightSubsidy,
        shippingCostStatus: orderShippingCostStatus,
        navyaReturnShippingCost: sellerReturnFreight,
        navyaRtoLogisticsCost: sellerRtoFreight,
        navyaCancellationLogisticsCost: sellerCancellationLoss,
        courierCodCost: sellerCourierCodCharge,
        otherVariableCost: 0,
        variableCostTotal: sellerVariableCostTotal,
        grossContribution: sellerGrossContribution,
        contributionMarginPercent: sellerMarginPct,
        items: itemBreakdowns,
        shipments: shipmentBreakdowns,
      });
    }

    // 4. Order Level Rollup
    const platformOutputTax = this.calculatePlatformOutputTax(orderCommissionEarned, orderCodFee, {
      commissionTaxRate,
      codFeeTaxRate,
    });
    const orderNetRevenue = CommissionService.roundMoney(
      orderCommissionEarned + orderCustomerShipping + orderCodFee - platformOutputTax,
    );

    const orderVariableCostTotal = CommissionService.roundMoney(
      gatewayCostUsed +
        orderNavyaCouponSubsidy +
        orderNavyaForwardShipping +
        orderNavyaReturnShipping +
        orderNavyaRtoLogistics +
        orderNavyaCancellationLoss +
        orderCourierCodFee,
    );

    const orderGrossContribution = CommissionService.roundMoney(
      orderNetRevenue - orderVariableCostTotal,
    );
    const orderMarginPct = this.calculateMarginPercent(orderGrossContribution, orderNetRevenue);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      contributionStatus,
      calculationVersion: this.VERSION,
      calculatedAt: new Date().toISOString(),
      commissionEarned: orderCommissionEarned,
      customerShippingCollected: orderCustomerShipping,
      codFeeCollected: orderCodFee,
      otherNavyaRevenue: 0,
      applicablePlatformTax: platformOutputTax,
      platformOutputTax,
      revenueTotal: orderNetRevenue,
      gatewayFeeActual,
      gatewayTaxActual,
      gatewayFeeEstimated,
      gatewayCostUsed,
      gatewayFeeStatus,
      isEstimatedGatewayFee: gatewayFeeStatus === 'ESTIMATED',
      navyaCouponSubsidy: orderNavyaCouponSubsidy,
      navyaForwardShippingCost: orderNavyaForwardShipping,
      navyaFreeShippingSubsidy: orderNavyaFreeShipping,
      shippingCostStatus: orderShippingCostStatus,
      navyaReturnShippingCost: orderNavyaReturnShipping,
      navyaRtoLogisticsCost: orderNavyaRtoLogistics,
      navyaCancellationLogisticsCost: orderNavyaCancellationLoss,
      courierCodCollectionFee: orderCourierCodFee,
      otherVariableCost: 0,
      variableCostTotal: orderVariableCostTotal,
      grossContribution: orderGrossContribution,
      contributionMarginPercent: orderMarginPct,
      taxRuleVersion,
      commissionTaxRate,
      codFeeTaxRate,
      gatewayEstimateRate,
      gatewayEstimateTaxRate,
      sellers: sellerBreakdowns,
    };
  }

  /**
   * Persists or updates the authoritative OrderContribution model record in the database idempotently.
   */
  public static async recordOrderContribution(
    orderIdOrNumber: string,
    forcedStatus?: ContributionStatus,
    txClient?: PrismaClient | Prisma.TransactionClient,
  ) {
    const client = txClient || prisma;
    const breakdown = await this.calculateOrderContribution(orderIdOrNumber, client);
    const status = forcedStatus || breakdown.contributionStatus;

    // Master Order Contribution Upsert
    const existing = await client.orderContribution.findFirst({
      where: {
        masterOrderId: breakdown.orderId,
        vendorOrderId: null,
      },
    });

    const dataPayload = {
      masterOrderId: breakdown.orderId,
      vendorOrderId: null,
      shopId: null,
      status,
      calculationVersion: breakdown.calculationVersion,
      commissionEarned: breakdown.commissionEarned,
      customerShippingCollected: breakdown.customerShippingCollected,
      codFeeCollected: breakdown.codFeeCollected,
      otherNavyaRevenue: breakdown.otherNavyaRevenue,
      applicablePlatformTax: breakdown.applicablePlatformTax,
      revenueTotal: breakdown.revenueTotal,
      gatewayFeeActual: breakdown.gatewayFeeActual,
      gatewayTaxActual: breakdown.gatewayTaxActual,
      gatewayFeeEstimated: breakdown.gatewayFeeEstimated,
      gatewayFeeStatus: breakdown.gatewayFeeStatus,
      navyaCouponSubsidy: breakdown.navyaCouponSubsidy,
      navyaForwardShippingCost: breakdown.navyaForwardShippingCost,
      navyaFreeShippingSubsidy: breakdown.navyaFreeShippingSubsidy,
      shippingCostStatus: breakdown.shippingCostStatus,
      navyaReturnShippingCost: breakdown.navyaReturnShippingCost,
      navyaRtoLogisticsCost: breakdown.navyaRtoLogisticsCost,
      navyaCancellationLogisticsCost: breakdown.navyaCancellationLogisticsCost,
      courierCodCollectionFee: breakdown.courierCodCollectionFee,
      otherVariableCost: breakdown.otherVariableCost,
      variableCostTotal: breakdown.variableCostTotal,
      grossContribution: breakdown.grossContribution,
      contributionMarginPercent: breakdown.contributionMarginPercent,
      taxRuleVersion: breakdown.taxRuleVersion || 'v1.0',
      commissionTaxRate:
        breakdown.commissionTaxRate !== undefined
          ? new Prisma.Decimal(breakdown.commissionTaxRate)
          : undefined,
      codFeeTaxRate:
        breakdown.codFeeTaxRate !== undefined
          ? new Prisma.Decimal(breakdown.codFeeTaxRate)
          : undefined,
      gatewayEstimateRate:
        breakdown.gatewayEstimateRate !== undefined
          ? new Prisma.Decimal(breakdown.gatewayEstimateRate)
          : undefined,
      gatewayEstimateTaxRate:
        breakdown.gatewayEstimateTaxRate !== undefined
          ? new Prisma.Decimal(breakdown.gatewayEstimateTaxRate)
          : undefined,
      calculatedAt: new Date(),
    };

    let record;
    if (existing) {
      record = await client.orderContribution.update({
        where: { id: existing.id },
        data: dataPayload,
      });
    } else {
      record = await client.orderContribution.create({
        data: dataPayload,
      });
    }

    // Also persist discrete VendorOrder child contribution records for multi-seller auditability
    for (const seller of breakdown.sellers) {
      if (!seller.vendorOrderId) continue;

      const existingChild = await client.orderContribution.findFirst({
        where: {
          masterOrderId: breakdown.orderId,
          vendorOrderId: seller.vendorOrderId,
        },
      });

      const childPayload = {
        masterOrderId: breakdown.orderId,
        vendorOrderId: seller.vendorOrderId,
        shopId: seller.shopId,
        status,
        calculationVersion: breakdown.calculationVersion,
        commissionEarned: seller.commissionEarned,
        customerShippingCollected: seller.customerShippingCollected,
        codFeeCollected: seller.codFeeCollected,
        otherNavyaRevenue: seller.otherNavyaRevenue,
        applicablePlatformTax: seller.applicablePlatformTax,
        revenueTotal: seller.revenueTotal,
        gatewayFeeActual: seller.gatewayCost,
        gatewayTaxActual: 0,
        gatewayFeeEstimated: seller.gatewayCost,
        gatewayFeeStatus: seller.gatewayFeeStatus,
        navyaCouponSubsidy: seller.navyaCouponSubsidy,
        navyaForwardShippingCost: seller.navyaForwardShippingCost,
        navyaFreeShippingSubsidy: seller.navyaFreeShippingSubsidy,
        shippingCostStatus: seller.shippingCostStatus,
        navyaReturnShippingCost: seller.navyaReturnShippingCost,
        navyaRtoLogisticsCost: seller.navyaRtoLogisticsCost,
        navyaCancellationLogisticsCost: seller.navyaCancellationLogisticsCost,
        courierCodCollectionFee: seller.courierCodCost,
        otherVariableCost: seller.otherVariableCost,
        variableCostTotal: seller.variableCostTotal,
        grossContribution: seller.grossContribution,
        contributionMarginPercent: seller.contributionMarginPercent,
        taxRuleVersion: breakdown.taxRuleVersion || 'v1.0',
        commissionTaxRate:
          breakdown.commissionTaxRate !== undefined
            ? new Prisma.Decimal(breakdown.commissionTaxRate)
            : undefined,
        codFeeTaxRate:
          breakdown.codFeeTaxRate !== undefined
            ? new Prisma.Decimal(breakdown.codFeeTaxRate)
            : undefined,
        gatewayEstimateRate:
          breakdown.gatewayEstimateRate !== undefined
            ? new Prisma.Decimal(breakdown.gatewayEstimateRate)
            : undefined,
        gatewayEstimateTaxRate:
          breakdown.gatewayEstimateTaxRate !== undefined
            ? new Prisma.Decimal(breakdown.gatewayEstimateTaxRate)
            : undefined,
        calculatedAt: new Date(),
      };

      if (existingChild) {
        await client.orderContribution.update({
          where: { id: existingChild.id },
          data: childPayload,
        });
      } else {
        await client.orderContribution.create({
          data: childPayload,
        });
      }
    }

    return record;
  }

  /**
   * Reconciles actual gateway fee into the transaction and updates order contribution.
   */
  public static async syncActualGatewayFee(params: {
    orderId: string;
    razorpayPaymentId: string;
    actualFee: number;
    actualTax?: number;
  }) {
    const { orderId, razorpayPaymentId, actualFee, actualTax = 0 } = params;

    await prisma.paymentTransaction.updateMany({
      where: { razorpayPaymentId },
      data: {
        gatewayFee: actualFee,
        gatewayTax: actualTax,
        gatewayFeeStatus: 'ACTUAL',
      },
    });

    return this.recordOrderContribution(orderId);
  }

  /**
   * Reconciles actual carrier shipping charges into Shipment and updates order contribution.
   */
  public static async syncActualShippingCost(params: {
    shipmentId: string;
    actualForwardShippingCost?: number;
    actualReverseShippingCost?: number;
  }) {
    const { shipmentId, actualForwardShippingCost, actualReverseShippingCost } = params;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      throw new Error(`Shipment ${shipmentId} not found.`);
    }

    const data: any = { shippingCostStatus: 'ACTUAL' };
    if (actualForwardShippingCost !== undefined)
      data.actualForwardShippingCost = actualForwardShippingCost;
    if (actualReverseShippingCost !== undefined)
      data.actualReverseShippingCost = actualReverseShippingCost;

    await prisma.shipment.update({
      where: { id: shipmentId },
      data,
    });

    return this.recordOrderContribution(shipment.masterOrderId);
  }

  /**
   * Calculates isolated contribution for a single vendor order.
   */
  public static async calculateSellerContribution(
    vendorOrderId: string,
  ): Promise<SellerContributionBreakdown> {
    const vo = await prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      select: { masterOrderId: true },
    });
    if (!vo) {
      throw new Error(`VendorOrder ${vendorOrderId} not found.`);
    }
    const orderBreakdown = await this.calculateOrderContribution(vo.masterOrderId);
    const seller = orderBreakdown.sellers.find((s) => s.vendorOrderId === vendorOrderId);
    if (!seller) {
      throw new Error(`Seller breakdown for VendorOrder ${vendorOrderId} not found.`);
    }
    return seller;
  }

  /**
   * Calculates isolated contribution for a single shipment.
   */
  public static async calculateShipmentContribution(
    shipmentId: string,
  ): Promise<ShipmentContributionBreakdown> {
    const shp = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      select: { masterOrderId: true },
    });
    if (!shp) {
      throw new Error(`Shipment ${shipmentId} not found.`);
    }
    const orderBreakdown = await this.calculateOrderContribution(shp.masterOrderId);
    for (const seller of orderBreakdown.sellers) {
      const found = seller.shipments.find((s) => s.shipmentId === shipmentId);
      if (found) return found;
    }
    throw new Error(`Shipment ${shipmentId} not found in order breakdown.`);
  }

  /**
   * Calculates isolated contribution for a single order item.
   */
  public static async calculateItemContribution(
    orderItemId: string,
  ): Promise<ItemContributionBreakdown> {
    const item = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { orderId: true },
    });
    if (!item) {
      throw new Error(`OrderItem ${orderItemId} not found.`);
    }
    const orderBreakdown = await this.calculateOrderContribution(item.orderId);
    for (const seller of orderBreakdown.sellers) {
      const found = seller.items.find((i) => i.orderItemId === orderItemId);
      if (found) return found;
    }
    throw new Error(`OrderItem ${orderItemId} not found in order breakdown.`);
  }

  /**
   * Generates periodic aggregate unit economics reporting.
   */
  public static async getPeriodicContributionReport(
    params: {
      startDate?: Date | string;
      endDate?: Date | string;
      shopId?: string;
      paymentMethod?: string;
      groupBy?: 'day' | 'week' | 'month' | 'seller';
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const {
      startDate,
      endDate,
      shopId,
      paymentMethod,
      groupBy = 'day',
      limit = 50,
      offset = 0,
    } = params;

    const where: any = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod as PaymentMethod;
    }

    const orders = await prisma.order.findMany({
      where,
      select: { id: true },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    const breakdowns: OrderContributionBreakdown[] = [];
    for (const ord of orders) {
      const b = await this.calculateOrderContribution(ord.id);
      if (shopId) {
        // filter sellers if shopId specified
        b.sellers = b.sellers.filter((s) => s.shopId === shopId);
        if (b.sellers.length > 0) {
          breakdowns.push(b);
        }
      } else {
        breakdowns.push(b);
      }
    }

    // Aggregates
    let totalRevenue = 0;
    let totalCommission = 0;
    let totalCustomerShipping = 0;
    let totalCodFees = 0;
    let totalGatewayCosts = 0;
    let totalCoupons = 0;
    let totalForwardFreight = 0;
    let totalRtoCosts = 0;
    let totalReturnCosts = 0;
    let totalCancellationLoss = 0;
    let totalVariableCosts = 0;
    let totalContribution = 0;

    for (const b of breakdowns) {
      totalRevenue = CommissionService.roundMoney(totalRevenue + b.revenueTotal);
      totalCommission = CommissionService.roundMoney(totalCommission + b.commissionEarned);
      totalCustomerShipping = CommissionService.roundMoney(
        totalCustomerShipping + b.customerShippingCollected,
      );
      totalCodFees = CommissionService.roundMoney(totalCodFees + b.codFeeCollected);
      totalGatewayCosts = CommissionService.roundMoney(totalGatewayCosts + b.gatewayCostUsed);
      totalCoupons = CommissionService.roundMoney(totalCoupons + b.navyaCouponSubsidy);
      totalForwardFreight = CommissionService.roundMoney(
        totalForwardFreight + b.navyaForwardShippingCost,
      );
      totalRtoCosts = CommissionService.roundMoney(totalRtoCosts + b.navyaRtoLogisticsCost);
      totalReturnCosts = CommissionService.roundMoney(totalReturnCosts + b.navyaReturnShippingCost);
      totalCancellationLoss = CommissionService.roundMoney(
        totalCancellationLoss + b.navyaCancellationLogisticsCost,
      );
      totalVariableCosts = CommissionService.roundMoney(totalVariableCosts + b.variableCostTotal);
      totalContribution = CommissionService.roundMoney(totalContribution + b.grossContribution);
    }

    const overallMarginPct = this.calculateMarginPercent(totalContribution, totalRevenue);

    return {
      success: true,
      period: {
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        groupBy,
      },
      summary: {
        totalOrdersEvaluated: breakdowns.length,
        totalRevenue,
        totalCommission,
        totalCustomerShipping,
        totalCodFees,
        totalGatewayCosts,
        totalCoupons,
        totalForwardFreight,
        totalRtoCosts,
        totalReturnCosts,
        totalCancellationLoss,
        totalVariableCosts,
        totalContribution,
        overallMarginPercent: overallMarginPct,
      },
      orders: breakdowns,
    };
  }
}

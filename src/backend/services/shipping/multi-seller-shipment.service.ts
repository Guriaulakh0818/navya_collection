import { PaymentMethod, Prisma, PrismaClient } from '@prisma/client';

import { shiprocketClient } from '@/backend/lib/shiprocket';
import { CommissionService } from '@/backend/services/commission.service';
import { TaxService } from '@/frontend/features/tax/services/tax.service';
import { prisma } from '@/lib/prisma';

import { SHIPROCKET_CONSTANTS } from './constants';
import { ShiprocketLogger } from './logger';
import { StatusAggregatorService } from './status-aggregator.service';

export class MultiSellerShipmentService {
  /**
   * Generates discrete Shipment & ShipmentItem entities for a Master Order
   * grouping items by Shop and Pickup Location with frozen address snapshots.
   */
  static async createShipmentsForOrder(
    masterOrderId: string,
    txClient?: PrismaClient | Prisma.TransactionClient,
  ) {
    const client = txClient || prisma;

    const masterOrder = await client.order.findUnique({
      where: { id: masterOrderId },
      include: {
        address: true,
        user: true,
        vendorOrders: true,
        items: {
          include: {
            product: {
              include: {
                pickupLocation: true,
                shop: {
                  include: {
                    pickupLocations: {
                      where: { isPrimary: true },
                      take: 1,
                    },
                  },
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!masterOrder) {
      throw new Error(`Master Order ${masterOrderId} not found.`);
    }

    if (!masterOrder.address) {
      throw new Error(`Master Order ${masterOrderId} is missing delivery address.`);
    }

    // Freeze Customer Delivery Address Snapshot
    const deliveryAddressSnapshot = {
      fullName: masterOrder.address.fullName,
      mobile: masterOrder.address.mobile,
      addressLine1: masterOrder.address.addressLine1,
      addressLine2: masterOrder.address.addressLine2 || null,
      city: masterOrder.address.city,
      state: masterOrder.address.state,
      pincode: masterOrder.address.pincode,
      country: 'India',
      addressType: masterOrder.address.type || 'HOME',
      email: masterOrder.user?.email || null,
    };

    // 1. Group items by (shopId + pickupLocationId)
    interface GroupedShipmentData {
      shopId: string;
      sellerId: string;
      pickupLocationId?: string;
      pickupLocation?: any;
      shop: any;
      vendorOrder?: any;
      items: typeof masterOrder.items;
    }

    const groupsMap = new Map<string, GroupedShipmentData>();

    for (const item of masterOrder.items) {
      const product = item.product;
      const shop = product?.shop;
      const shopId = item.shopId || shop?.id || 'DEFAULT_SHOP';
      const sellerId = shop?.ownerId || masterOrder.userId;

      // Pickup location hierarchy: Item/Product specific -> Shop Primary -> Fallback
      let pickupLocation = product?.pickupLocation || shop?.pickupLocations?.[0] || undefined;

      // If no pickup location found yet, fetch from DB
      if (!pickupLocation && shopId !== 'DEFAULT_SHOP') {
        const found = await client.pickupLocation.findFirst({
          where: { shopId, isPrimary: true },
        });
        if (found) pickupLocation = found;
      }

      const pickupLocationId = pickupLocation?.id || undefined;
      const groupKey = `${shopId}_${pickupLocationId || 'DEFAULT'}`;

      if (!groupsMap.has(groupKey)) {
        // Find corresponding VendorOrder for this shop
        const vendorOrder = masterOrder.vendorOrders.find((vo) => vo.shopId === shopId);

        groupsMap.set(groupKey, {
          shopId,
          sellerId,
          pickupLocationId,
          pickupLocation: pickupLocation || undefined,
          shop,
          vendorOrder,
          items: [],
        });
      }

      groupsMap.get(groupKey)!.items.push(item);
    }

    const createdShipments = [];
    let shipmentIndex = 1;

    // 2. Iterate through groups and create discrete Shipment records
    const groupEntries = Array.from(groupsMap.entries());
    let cumulativeAllocatedCoupon = 0;
    let cumulativeCodFee = 0;
    let cumulativeCodFeeTax = 0;
    let cumulativeCodAmount = 0;

    const masterOrderSubtotal = Number(masterOrder.totalAmount || 0);
    const masterOrderCoupon = Number(masterOrder.discountAmount || 0);
    const isCod = masterOrder.paymentMethod === PaymentMethod.COD;

    for (let groupIdx = 0; groupIdx < groupEntries.length; groupIdx++) {
      const [, group] = groupEntries[groupIdx];
      const isLastGroup = groupIdx === groupEntries.length - 1;
      const { shopId, sellerId, pickupLocationId, pickupLocation, shop, vendorOrder, items } =
        group;

      // Freeze Seller Pickup Address Snapshot
      const pickupAddressSnapshot = {
        shopName: shop?.name || 'Navya Partner Shop',
        shopCode: shop?.shopCode || null,
        locationCode: pickupLocation?.locationCode || `${shop?.shopCode || 'SHOP'}-PKP1`,
        pickupLocationName: pickupLocation?.name || `${shop?.name || 'Shop'} Hub`,
        shiprocketPickupName:
          pickupLocation?.shiprocketPickupName ||
          shop?.shiprocketPickupName ||
          `${shop?.shopCode || 'SHOP'}-PKP1`,
        contactName:
          pickupLocation?.contactName || shop?.bankAccountHolder || shop?.name || 'Store Manager',
        contactPhone: pickupLocation?.contactPhone || shop?.phone || '9053883125',
        contactEmail: pickupLocation?.contactEmail || shop?.email || 'seller@navyacollection.store',
        addressLine1: pickupLocation?.addressLine1 || shop?.fullAddress || 'Main Market',
        addressLine2: pickupLocation?.addressLine2 || null,
        city: pickupLocation?.city || shop?.city || 'Hisar',
        state: pickupLocation?.state || shop?.state || 'Haryana',
        pincode: pickupLocation?.pincode || shop?.pincode || '125001',
        country: pickupLocation?.country || 'India',
      };

      // Calculate package dimensions and weight with safe unit normalization
      const { CustomerShippingService } = await import('./customer-shipping.service');

      let totalWeightGrams = 0;
      let maxLength = 10;
      let maxBreadth = 10;
      let totalHeight = 0;

      for (const itm of items) {
        const rawWeight = (itm.variant as any)?.weight ?? (itm.product as any)?.weight;
        const norm = CustomerShippingService.normalizeWeight(rawWeight);
        const length = Number((itm.variant as any)?.length || (itm.product as any)?.length || 10);
        const breadth = Number(
          (itm.variant as any)?.breadth || (itm.product as any)?.breadth || 10,
        );
        const height = Number((itm.variant as any)?.height || (itm.product as any)?.height || 5);

        totalWeightGrams += norm.weightGrams * itm.quantity;
        maxLength = Math.max(maxLength, length);
        maxBreadth = Math.max(maxBreadth, breadth);
        totalHeight += height * itm.quantity;
      }

      // Convert canonical grams to Shiprocket package weight in kilograms
      const totalWeightKg = Math.max(0.1, Number((totalWeightGrams / 1000).toFixed(3)));
      totalHeight = Math.min(100, Math.max(5, totalHeight));

      const shipmentSubtotal = items.reduce((sum, itm) => sum + Number(itm.total), 0);

      // Authoritative seller-level shipping calculation via CustomerShippingService (BM-05 Engine)
      const sellerShippingCalc = CustomerShippingService.calculateCustomerShipping({
        items: items.map((i) => ({
          productId: i.productId,
          price: Number(i.price),
          quantity: i.quantity,
          shopId,
        })),
        shippingMethodCode: (masterOrder as any).shippingMode || 'STANDARD',
        paymentMethod: masterOrder.paymentMethod,
        isFirstOrder: Boolean((masterOrder as any).isFirstOrder),
      });

      const sellerBreakdown = sellerShippingCalc.sellerBreakdown[0];
      const sellerShippingCharge = sellerBreakdown?.shippingCharge ?? 0;
      const isFreeShipping = sellerBreakdown?.isFreeShipping ?? sellerShippingCharge === 0;
      const freeShippingSource = sellerBreakdown?.freeShippingSource || null;
      const freeShippingThreshold = sellerBreakdown?.threshold || null;
      const costBearer = sellerBreakdown?.costBearer || null;

      // BM-07 AC-07: Multi-Seller COD Amount Reconciliation:
      // Shipment COD Amount = Subtotal - Seller Coupon + Seller Shipping + Seller Tax + Seller COD Fee + Seller COD Fee Tax
      let sellerAllocatedCoupon = 0;
      if (masterOrderCoupon > 0 && masterOrderSubtotal > 0) {
        if (isLastGroup) {
          sellerAllocatedCoupon = Math.max(
            0,
            CommissionService.roundMoney(masterOrderCoupon - cumulativeAllocatedCoupon),
          );
        } else {
          const ratio = shipmentSubtotal / masterOrderSubtotal;
          sellerAllocatedCoupon = CommissionService.roundMoney(masterOrderCoupon * ratio);
          cumulativeAllocatedCoupon = CommissionService.roundMoney(
            cumulativeAllocatedCoupon + sellerAllocatedCoupon,
          );
        }
      }

      const sellerTaxAmount = items.reduce((sum, i) => sum + Number((i as any).taxAmount || 0), 0);

      let sellerCodFee = 0;
      let sellerCodFeeTax = 0;
      let codAmount = 0;

      if (isCod) {
        const sellerCodFeeBase = Math.max(
          0,
          CommissionService.roundMoney(
            shipmentSubtotal - sellerAllocatedCoupon + sellerShippingCharge + sellerTaxAmount,
          ),
        );

        if (isLastGroup && Number(masterOrder.codFee || 0) > 0) {
          sellerCodFee = Math.max(
            0,
            CommissionService.roundMoney(Number(masterOrder.codFee) - cumulativeCodFee),
          );
        } else {
          sellerCodFee = CommissionService.roundMoney(sellerCodFeeBase * 0.015);
          cumulativeCodFee = CommissionService.roundMoney(cumulativeCodFee + sellerCodFee);
        }

        if (isLastGroup && Number(masterOrder.codFeeTax || 0) > 0) {
          sellerCodFeeTax = Math.max(
            0,
            CommissionService.roundMoney(Number(masterOrder.codFeeTax) - cumulativeCodFeeTax),
          );
        } else {
          const taxResCod = await TaxService.calculateCodFeeTax({
            codFee: sellerCodFee,
            customerState: masterOrder.address?.state,
          });
          sellerCodFeeTax = taxResCod.taxAmount;
          cumulativeCodFeeTax = CommissionService.roundMoney(cumulativeCodFeeTax + sellerCodFeeTax);
        }

        if (isLastGroup && Number(masterOrder.finalAmount || 0) > 0) {
          // Invariant: SUM(all COD shipment amounts) = final customer COD payable amount
          codAmount = Math.max(
            0,
            CommissionService.roundMoney(Number(masterOrder.finalAmount) - cumulativeCodAmount),
          );
        } else {
          codAmount = CommissionService.roundMoney(
            shipmentSubtotal -
              sellerAllocatedCoupon +
              sellerShippingCharge +
              sellerTaxAmount +
              sellerCodFee +
              sellerCodFeeTax,
          );
          cumulativeCodAmount = CommissionService.roundMoney(cumulativeCodAmount + codAmount);
        }
      }

      const paddedIndex = String(shipmentIndex).padStart(2, '0');
      const cleanOrderNumber = masterOrder.orderNumber.replace(/[^A-Za-z0-9]/g, '').slice(-8);
      const shipmentNumber = `NAV-SHP-${cleanOrderNumber}-${paddedIndex}`;
      shipmentIndex++;

      // Ensure shop exists to satisfy foreign key constraint
      let validShopId = shopId;
      let validSellerId = sellerId;
      const existingShop = await client.shop.findUnique({
        where: { id: validShopId },
        select: { id: true, ownerId: true },
      });

      if (!existingShop) {
        let anyShop = await client.shop.findFirst({ select: { id: true, ownerId: true } });
        if (!anyShop) {
          let sellerUser = await client.user.findFirst({
            where: { role: 'SELLER' },
            select: { id: true },
          });
          if (!sellerUser) {
            sellerUser = await client.user.findFirst({ select: { id: true } });
          }
          if (sellerUser) {
            anyShop = await client.shop.create({
              data: {
                id: validShopId,
                name: 'Navya Collection Main Store',
                slug: `navya-main-${Date.now()}`,
                phone: '9053883125',
                email: 'store@navyacollection.store',
                city: 'Fatehabad',
                state: 'Haryana',
                pincode: '125050',
                fullAddress: 'Main Market, Fatehabad, Haryana',
                ownerId: sellerUser.id,
              },
              select: { id: true, ownerId: true },
            });
          }
        }
        if (anyShop) {
          validShopId = anyShop.id;
          validSellerId = anyShop.ownerId;
        }
      }

      // Create Shipment record with BM-05 & BM-07 Snapshot Fields
      const shipment = await client.shipment.create({
        data: {
          shipmentNumber,
          masterOrderId: masterOrder.id,
          vendorOrderId: vendorOrder?.id || null,
          sellerId: validSellerId,
          shopId: validShopId,
          pickupLocationId: pickupLocationId || null,
          pickupAddressSnapshot,
          deliveryAddressSnapshot,
          packageWeight: totalWeightKg,
          packageLength: maxLength,
          packageBreadth: maxBreadth,
          packageHeight: totalHeight,
          itemCount: items.reduce((sum, itm) => sum + itm.quantity, 0),
          paymentMethod: masterOrder.paymentMethod,
          codAmount,
          codFee: isCod ? sellerCodFee : 0,
          codFeeTax: isCod ? sellerCodFeeTax : 0,
          codRemittanceStatus: isCod ? 'PENDING' : null,
          shippingCharge: sellerShippingCharge,
          actualForwardShippingCost:
            costBearer === 'NAVYA' || isFreeShipping
              ? ((masterOrder as any).shippingMode || 'STANDARD') === 'EXPRESS'
                ? 99
                : 49
              : 0,
          shippingCostStatus: 'ESTIMATED',
          shippingMode: (masterOrder as any).shippingMode || 'STANDARD',
          isFreeShipping,
          freeShippingSource,
          freeShippingThreshold,
          costBearer,
          sellerSubtotal: shipmentSubtotal,
          status: 'CREATED',
          trackingStatus: 'PENDING',
        },
      });

      // Create Shipment Items
      for (const itm of items) {
        await client.shipmentItem.create({
          data: {
            shipmentId: shipment.id,
            orderItemId: itm.id,
            productId: itm.productId,
            variantId: itm.variantId || null,
            name: itm.name,
            sku: itm.sku,
            size: itm.variant?.size || null,
            color: itm.variant?.color || null,
            price: itm.price,
            quantity: itm.quantity,
            total: itm.total,
          },
        });
      }

      createdShipments.push(shipment);
    }

    return createdShipments;
  }

  /**
   * Authoritative Shiprocket Ad-Hoc Order Creation for a single Shipment.
   * Dispatches order payload to Shiprocket API and updates database records.
   */
  static async dispatchShipmentToShiprocket(shipmentId: string): Promise<{
    success: boolean;
    message: string;
    shipment?: any;
    shiprocketResponse?: any;
  }> {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          shop: {
            include: { pickupLocations: true },
          },
          masterOrder: {
            include: { address: true, user: true },
          },
          items: {
            include: { product: true, variant: true },
          },
        },
      });

      if (!shipment) {
        return { success: false, message: 'Shipment not found.' };
      }

      // Check if already dispatched to Shiprocket
      if (shipment.shiprocketOrderId && shipment.shiprocketShipmentId) {
        return {
          success: true,
          message: 'Shipment is already registered with Shiprocket.',
          shipment,
        };
      }

      const isCod =
        shipment.paymentMethod === 'COD' || shipment.masterOrder?.paymentMethod === 'COD';

      // BM-07 Section 6: COD Verification Guard
      // Shipment dispatch is strictly blocked until Shiprocket COD verification is VERIFIED.
      if (isCod && shipment.masterOrder?.codVerificationStatus !== 'VERIFIED') {
        ShiprocketLogger.warn(
          `[SHIPROCKET_COD_VERIFICATION_BLOCKED] Shipment ${shipment.shipmentNumber} dispatch blocked. COD verification status: ${shipment.masterOrder?.codVerificationStatus || 'PENDING'}`,
        );
        return {
          success: false,
          message: `Cannot dispatch COD shipment: verification status is ${shipment.masterOrder?.codVerificationStatus || 'PENDING'}. Order must be VERIFIED before dispatch.`,
          shipment,
        };
      }

      // Check if Shiprocket credentials exist
      if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
        ShiprocketLogger.warn(
          '[SHIPROCKET_DISPATCH_SKIPPED] Shiprocket credentials not configured.',
        );
        return {
          success: false,
          message: 'Shiprocket credentials not configured.',
          shipment,
        };
      }

      const pickupSnap: any = shipment.pickupAddressSnapshot || {};
      const deliverySnap: any = shipment.deliveryAddressSnapshot || {};

      const formattedOrderItems = shipment.items.map((item) => ({
        name: item.name,
        sku: item.sku || `SKU-${item.productId.slice(-6)}`,
        units: item.quantity,
        selling_price: Number(item.price),
        discount: 0,
        tax: 0,
        hsn: 6204, // Garments / Apparel HSN default
      }));

      const orderDate = new Date(shipment.createdAt).toISOString().replace('T', ' ').slice(0, 16);

      // Determine best pickup location nickname
      const chosenPickup =
        shipment.shop?.pickupLocations?.find((p: any) => p.shiprocketStatus === 'CONNECTED')
          ?.shiprocketPickupName ||
        shipment.shop?.shiprocketPickupName ||
        pickupSnap.shiprocketPickupName ||
        pickupSnap.locationCode ||
        'Primary';

      const shippingCharges = Number(shipment.shippingCharge || 0);
      // For COD: Shiprocket courier collection = sub_total + shipping_charges.
      // Since shipment.codAmount is the all-inclusive collection target (subtotal - coupon + tax + shipping + codFee + codFeeTax),
      // we set sub_total = codAmount - shippingCharges so that courier collects exact codAmount.
      const subTotal = isCod
        ? Math.max(0, Math.round((Number(shipment.codAmount) - shippingCharges) * 100) / 100)
        : Number(
            shipment.sellerSubtotal || shipment.items.reduce((s, i) => s + Number(i.total), 0),
          );

      const payload = {
        order_id: shipment.shipmentNumber,
        order_date: orderDate,
        pickup_location: chosenPickup,
        channel_id: '',
        comment: `Navya Marketplace Order #${shipment.masterOrder.orderNumber}`,
        billing_customer_name: deliverySnap.fullName?.split(' ')[0] || 'Valued Customer',
        billing_last_name: deliverySnap.fullName?.split(' ').slice(1).join(' ') || '',
        billing_address: deliverySnap.addressLine1 || 'Delivery Address',
        billing_address_2: deliverySnap.addressLine2 || '',
        billing_city: deliverySnap.city || 'Delhi',
        billing_pincode: deliverySnap.pincode || '110001',
        billing_state: deliverySnap.state || 'Delhi',
        billing_country: deliverySnap.country || 'India',
        billing_email: deliverySnap.email || 'customer@navyacollection.store',
        billing_phone: deliverySnap.mobile || '9999999999',
        shipping_is_billing: true,
        order_items: formattedOrderItems,
        payment_method: isCod ? 'COD' : 'Prepaid',
        shipping_charges: shippingCharges,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: subTotal,
        length: Number(shipment.packageLength || 10),
        breadth: Number(shipment.packageBreadth || 10),
        height: Number(shipment.packageHeight || 10),
        weight: Number(shipment.packageWeight || 0.5),
      };

      ShiprocketLogger.info(
        `[SHIPROCKET_CREATE_ORDER_REQUEST] Dispatching ${shipment.shipmentNumber} with pickup ${chosenPickup}`,
        undefined,
        payload,
      );

      let response;
      try {
        response = await shiprocketClient.post(
          SHIPROCKET_CONSTANTS.ENDPOINTS.CREATE_ORDER,
          payload,
        );
      } catch (postError: any) {
        // If pickup location failed, retry with fallback 'Primary' or 'NAVYA-SHOP-000001'
        const errMsg = (postError.response?.data?.message || postError.message || '').toLowerCase();
        if (
          errMsg.includes('pickup') ||
          errMsg.includes('location') ||
          errMsg.includes('address')
        ) {
          ShiprocketLogger.warn(
            `[SHIPROCKET_PICKUP_RETRY] Retrying ${shipment.shipmentNumber} with fallback 'Primary'`,
          );
          payload.pickup_location = 'Primary';
          response = await shiprocketClient.post(
            SHIPROCKET_CONSTANTS.ENDPOINTS.CREATE_ORDER,
            payload,
          );
        } else {
          throw postError;
        }
      }

      if (response.data && response.data.order_id && response.data.shipment_id) {
        const updated = await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            shiprocketOrderId: String(response.data.order_id),
            shiprocketShipmentId: String(response.data.shipment_id),
            awbCode: response.data.awb_code || null,
            courierName: response.data.courier_name || null,
            status: 'READY_TO_SHIP',
          },
        });

        // Also sync identifiers to child vendor order if linked
        if (shipment.vendorOrderId) {
          await prisma.vendorOrder
            .update({
              where: { id: shipment.vendorOrderId },
              data: {
                shiprocketOrderId: String(response.data.order_id),
                shiprocketShipmentId: String(response.data.shipment_id),
                awbCode: response.data.awb_code || null,
                courierName: response.data.courier_name || null,
              },
            })
            .catch(() => {});
        }

        return {
          success: true,
          message: 'Shipment created on Shiprocket successfully.',
          shipment: updated,
          shiprocketResponse: response.data,
        };
      }

      return {
        success: false,
        message: response.data?.message || 'Failed to create shipment on Shiprocket.',
        shiprocketResponse: response.data,
      };
    } catch (error: any) {
      ShiprocketLogger.error('[SHIPROCKET_DISPATCH_SHIPMENT_ERROR]', undefined, {
        error: error.message,
        response: error.response?.data,
      });

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Shiprocket API error.',
      };
    }
  }

  /**
   * Cancels a discrete shipment safely without corrupting other sellers' shipments.
   * Atomically restores inventory for the cancelled shipment's items.
   */
  static async cancelShipment(shipmentId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          items: true,
          masterOrder: {
            include: { shipments: true },
          },
        },
      });

      if (!shipment) {
        throw new Error('Shipment not found.');
      }

      const isPostShipmentCancellation = [
        'SHIPPED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
      ].includes(shipment.status);

      // 1. Mark Shipment as Cancelled
      const updatedShipment = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // BM-05 Section 29 & 56: If cancelled after shipment, Navya bears logistics loss; seller is NOT debited
      if (isPostShipmentCancellation) {
        const forwardCost = Number(shipment.actualForwardShippingCost || 49);
        const reverseCost = Number(shipment.actualReverseShippingCost || 0);
        const logisticsLoss = forwardCost + reverseCost;

        await tx.financialAuditLog.create({
          data: {
            entityType: 'LOGISTICS_LOSS',
            entityId: shipment.id,
            action: 'POST_SHIPMENT_CANCELLATION_LOSS_NAVYA_BEARER',
            amount: logisticsLoss,
            notes: `BM-05 post-shipment cancellation: Logistics loss of ₹${logisticsLoss} borne 100% by Navya. Seller is NOT debited. Shipment #${shipment.shipmentNumber}.`,
            idempotencyKey: `CANCEL_LOSS:${shipment.id}`,
          },
        });

        try {
          const { ContributionService } = await import('@/backend/services/contribution.service');
          await ContributionService.recordOrderContribution(
            shipment.masterOrderId,
            'CANCELLED' as any,
            tx,
          );
        } catch (cErr) {
          console.warn('[BM11_CANCEL_CONTRIBUTION_WARN]', cErr);
        }
      }

      // 2. Update child VendorOrder if present
      if (shipment.vendorOrderId) {
        await tx.vendorOrder.update({
          where: { id: shipment.vendorOrderId },
          data: { status: 'CANCELLED' },
        });
      }

      // 3. Atomically restore inventory stock
      for (const item of shipment.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              availableStock: { increment: item.quantity },
              soldStock: { decrement: item.quantity },
            },
          });
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
          },
        });
      }

      // 4. Recalculate Master Order Status
      const remainingShipments = shipment.masterOrder.shipments.map((s) =>
        s.id === shipment.id ? { ...s, status: 'CANCELLED' } : s,
      );

      const newMasterStatus =
        StatusAggregatorService.calculateMasterOrderStatus(remainingShipments);

      await tx.order.update({
        where: { id: shipment.masterOrderId },
        data: { orderStatus: newMasterStatus },
      });

      // BM-10: Restore coupon usage if master order is fully CANCELLED
      if (newMasterStatus === 'CANCELLED' && (shipment.masterOrder as any).couponId) {
        const { CouponRepository } =
          await import('@/features/coupons/repositories/coupon.repository');
        await CouponRepository.restoreUsage(
          (shipment.masterOrder as any).couponId,
          shipment.masterOrder.userId,
          shipment.masterOrderId,
          tx,
        );
      }

      return {
        shipment: updatedShipment,
        masterOrderStatus: newMasterStatus,
      };
    });
  }

  /**
   * BM-05 Post-shipment cancellation loss recording.
   * Applicable logistics loss is borne 100% by Navya; the seller is never debited.
   */
  static recordPostShipmentCancellationLoss(params: {
    orderId: string;
    shipmentId: string;
    shopId: string;
    actualLogisticsCost: number;
  }) {
    return {
      orderId: params.orderId,
      shipmentId: params.shipmentId,
      shopId: params.shopId,
      actualLogisticsCost: params.actualLogisticsCost,
      logisticsLossBorneBy: 'NAVYA' as const,
      sellerDebitAmount: 0,
      reason: `BM-05 Post-shipment cancellation loss borne 100% by Navya. Seller is not debited.`,
    };
  }

  /**
   * BM-04 / BM-05 RTO cost split calculation (50% Navya / 50% Seller).
   */
  static calculateRtoCostSplit(eligibleRtoCost: number | string) {
    return {
      totalRtoCost:
        typeof eligibleRtoCost === 'string' ? parseFloat(eligibleRtoCost) : eligibleRtoCost,
      navyaShare: Math.round((Number(eligibleRtoCost) * 0.5 + Number.EPSILON) * 100) / 100,
      sellerShare: Math.round((Number(eligibleRtoCost) * 0.5 + Number.EPSILON) * 100) / 100,
    };
  }
}

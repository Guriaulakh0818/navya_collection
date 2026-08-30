import { PaymentMethod, Prisma, PrismaClient } from '@prisma/client';

import { shiprocketClient } from '@/backend/lib/shiprocket';
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
    for (const [, group] of Array.from(groupsMap.entries())) {
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
        contactPhone: pickupLocation?.contactPhone || shop?.phone || '9991983125',
        contactEmail: pickupLocation?.contactEmail || shop?.email || 'seller@navyacollection.store',
        addressLine1: pickupLocation?.addressLine1 || shop?.fullAddress || 'Main Market',
        addressLine2: pickupLocation?.addressLine2 || null,
        city: pickupLocation?.city || shop?.city || 'Hisar',
        state: pickupLocation?.state || shop?.state || 'Haryana',
        pincode: pickupLocation?.pincode || shop?.pincode || '125001',
        country: pickupLocation?.country || 'India',
      };

      // Calculate package dimensions and weight
      let totalWeight = 0;
      let maxLength = 10;
      let maxBreadth = 10;
      let totalHeight = 0;

      for (const itm of items) {
        const itemWeight = Number(
          (itm.variant as any)?.weight || (itm.product as any)?.weight || 0.5,
        );
        const length = Number((itm.variant as any)?.length || (itm.product as any)?.length || 10);
        const breadth = Number(
          (itm.variant as any)?.breadth || (itm.product as any)?.breadth || 10,
        );
        const height = Number((itm.variant as any)?.height || (itm.product as any)?.height || 5);

        totalWeight += itemWeight * itm.quantity;
        maxLength = Math.max(maxLength, length);
        maxBreadth = Math.max(maxBreadth, breadth);
        totalHeight += height * itm.quantity;
      }

      totalWeight = Math.max(0.2, Number(totalWeight.toFixed(2)));
      totalHeight = Math.min(100, Math.max(5, totalHeight));

      const shipmentSubtotal = items.reduce((sum, itm) => sum + Number(itm.total), 0);
      const isCod = masterOrder.paymentMethod === PaymentMethod.COD;
      const codAmount = isCod ? shipmentSubtotal : 0;

      const paddedIndex = String(shipmentIndex).padStart(2, '0');
      const cleanOrderNumber = masterOrder.orderNumber.replace(/[^A-Za-z0-9]/g, '').slice(-8);
      const shipmentNumber = `NAV-SHP-${cleanOrderNumber}-${paddedIndex}`;
      shipmentIndex++;

      // Create Shipment record
      const shipment = await client.shipment.create({
        data: {
          shipmentNumber,
          masterOrderId: masterOrder.id,
          vendorOrderId: vendorOrder?.id || null,
          sellerId,
          shopId,
          pickupLocationId: pickupLocationId || null,
          pickupAddressSnapshot,
          deliveryAddressSnapshot,
          packageWeight: totalWeight,
          packageLength: maxLength,
          packageBreadth: maxBreadth,
          packageHeight: totalHeight,
          itemCount: items.reduce((sum, itm) => sum + itm.quantity, 0),
          paymentMethod: masterOrder.paymentMethod,
          codAmount,
          shippingCharge: 0,
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

      const isCod = shipment.paymentMethod === 'COD';
      const orderDate = new Date(shipment.createdAt).toISOString().replace('T', ' ').slice(0, 16);

      const payload = {
        order_id: shipment.shipmentNumber,
        order_date: orderDate,
        pickup_location: pickupSnap.shiprocketPickupName || pickupSnap.locationCode || 'Primary',
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
        shipping_charges: Number(shipment.shippingCharge || 0),
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: Number(
          shipment.codAmount || shipment.items.reduce((s, i) => s + Number(i.total), 0),
        ),
        length: Number(shipment.packageLength || 10),
        breadth: Number(shipment.packageBreadth || 10),
        height: Number(shipment.packageHeight || 10),
        weight: Number(shipment.packageWeight || 0.5),
      };

      ShiprocketLogger.info(
        `[SHIPROCKET_CREATE_ORDER_REQUEST] Dispatching ${shipment.shipmentNumber}`,
        undefined,
        payload,
      );

      const response = await shiprocketClient.post(
        SHIPROCKET_CONSTANTS.ENDPOINTS.CREATE_ORDER,
        payload,
      );

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

      if (['DELIVERED', 'CANCELLED', 'RTO_DELIVERED'].includes(shipment.status)) {
        throw new Error(`Cannot cancel shipment in status ${shipment.status}.`);
      }

      // 1. Mark Shipment as Cancelled
      const updatedShipment = await tx.shipment.update({
        where: { id: shipment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

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

      return {
        shipment: updatedShipment,
        masterOrderStatus: newMasterStatus,
      };
    });
  }
}

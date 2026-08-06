import { prisma } from '@/lib/prisma';
import shiprocketClient from '@/lib/shiprocket';

import { AwbService } from './awb.service';
import { SHIPROCKET_CONSTANTS } from './constants';
import type {
  CreatedShipmentData,
  ShipmentValidationResult,
  ShiprocketCreateOrderPayload,
  ShiprocketCreateOrderResponse,
  ShiprocketOrderItem,
  StandardShippingResponse,
} from './types';

export class ShipmentService {
  /**
   * Validates customer shipping address parameters prior to dispatching to Shiprocket.
   */
  static validateCustomerAddress(address: {
    fullName?: string;
    mobile?: string;
    pincode?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
  }): ShipmentValidationResult {
    const errors: string[] = [];

    if (!address.fullName || address.fullName.trim().length === 0) {
      errors.push('Customer full name is required.');
    }

    const cleanMobile = (address.mobile || '').replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      errors.push('Valid 10-digit customer mobile number is required.');
    }

    const cleanPincode = (address.pincode || '').replace(/\D/g, '');
    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      errors.push(SHIPROCKET_CONSTANTS.ERRORS.INVALID_PINCODE);
    }

    if (!address.addressLine1 || address.addressLine1.trim().length < 3) {
      errors.push('Address line 1 must be at least 3 characters long.');
    }

    if (!address.city || address.city.trim().length === 0) {
      errors.push('City name is required.');
    }

    if (!address.state || address.state.trim().length === 0) {
      errors.push('State name is required.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates package physical parameters (weight and dimensions).
   */
  static validatePackageParameters(
    weight: number,
    length: number,
    breadth: number,
    height: number,
  ): ShipmentValidationResult {
    const errors: string[] = [];

    if (weight <= 0) {
      errors.push(SHIPROCKET_CONSTANTS.ERRORS.INVALID_WEIGHT);
    }

    if (length <= 0 || breadth <= 0 || height <= 0) {
      errors.push(SHIPROCKET_CONSTANTS.ERRORS.INVALID_DIMENSIONS);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates payment method (COD vs Prepaid).
   */
  static validatePaymentMethod(paymentMethod?: string): {
    valid: boolean;
    type: 'COD' | 'Prepaid';
    errors: string[];
  } {
    const errors: string[] = [];
    const normalized = (paymentMethod || '').trim().toUpperCase();

    if (normalized === 'COD') {
      return { valid: true, type: 'COD', errors: [] };
    }

    const validPrepaidMethods = ['PREPAID', 'RAZORPAY', 'UPI', 'CARD', 'NETBANKING'];
    if (validPrepaidMethods.includes(normalized)) {
      return { valid: true, type: 'Prepaid', errors: [] };
    }

    errors.push(SHIPROCKET_CONSTANTS.ERRORS.INVALID_PAYMENT_METHOD);
    return {
      valid: false,
      type: 'Prepaid',
      errors,
    };
  }

  /**
   * Creates a shipment on Shiprocket for a given order ID and persists the shipment metadata in PostgreSQL.
   */
  static async createShipmentForOrder(
    orderIdOrNumber: string,
    options?: {
      weight?: number;
      length?: number;
      breadth?: number;
      height?: number;
      pickupLocation?: string;
    },
  ): Promise<StandardShippingResponse<CreatedShipmentData>> {
    try {
      console.log(
        `[SHIPMENT_CREATE] Initiating shipment creation for order: ${orderIdOrNumber}...`,
      );

      // 1. Fetch Order with relations from Prisma PostgreSQL DB
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
          deletedAt: null,
        },
        include: {
          address: true,
          user: true,
          items: {
            include: {
              variant: true,
              product: true,
            },
          },
        },
      });

      if (!order) {
        return {
          success: false,
          message: `${SHIPROCKET_CONSTANTS.ERRORS.ORDER_NOT_FOUND}: '${orderIdOrNumber}'`,
          statusCode: 404,
        };
      }

      // Check if shipment already created
      if (order.shiprocketShipmentId && order.shiprocketOrderId) {
        console.log(
          `[SHIPMENT_EXISTS] Order ${order.orderNumber} already has shipment ID ${order.shiprocketShipmentId}`,
        );
        return {
          success: true,
          message: 'Shipment already exists for this order.',
          statusCode: 200,
          data: {
            orderId: order.id,
            shiprocketOrderId: order.shiprocketOrderId,
            shiprocketShipmentId: order.shiprocketShipmentId,
            status: 'EXISTS',
            paymentMethod: order.paymentMethod,
            courierName: order.courierName || undefined,
            awbCode: order.awbCode || undefined,
          },
        };
      }

      // 2. Validate Customer Delivery Address
      const addressValidation = this.validateCustomerAddress({
        fullName: order.address?.fullName || order.user?.name || 'Customer',
        mobile: order.address?.mobile || order.user?.mobile || '',
        pincode: order.address?.pincode,
        addressLine1: order.address?.addressLine1,
        city: order.address?.city,
        state: order.address?.state,
      });

      if (!addressValidation.valid) {
        console.warn(
          `[SHIPMENT_VALIDATION_FAILED] Address validation errors:`,
          addressValidation.errors,
        );
        return {
          success: false,
          message: `Address validation failed: ${addressValidation.errors.join(', ')}`,
          statusCode: 400,
          error: {
            code: 'INVALID_SHIPPING_ADDRESS',
            details: addressValidation.errors,
          },
        };
      }

      // 3. Compute Package Weight and Dimensions
      const packageWeight =
        options?.weight ||
        order.items.reduce((acc, item) => {
          const itemWeight = item.variant?.weight || 0.5;
          return acc + itemWeight * item.quantity;
        }, 0) ||
        SHIPROCKET_CONSTANTS.DEFAULTS.WEIGHT_KG;

      const length = options?.length || SHIPROCKET_CONSTANTS.DEFAULTS.LENGTH_CM;
      const breadth = options?.breadth || SHIPROCKET_CONSTANTS.DEFAULTS.BREADTH_CM;
      const height = options?.height || SHIPROCKET_CONSTANTS.DEFAULTS.HEIGHT_CM;

      const pkgValidation = this.validatePackageParameters(packageWeight, length, breadth, height);
      if (!pkgValidation.valid) {
        return {
          success: false,
          message: `Package parameter validation failed: ${pkgValidation.errors.join(', ')}`,
          statusCode: 400,
          error: {
            code: 'INVALID_PACKAGE_PARAMETERS',
            details: pkgValidation.errors,
          },
        };
      }

      // 4. Format Order Items for Shiprocket
      const shiprocketItems: ShiprocketOrderItem[] = order.items.map((item) => ({
        name: item.name || item.product?.name || 'Fashion Item',
        sku: item.sku || item.variant?.sku || item.product?.sku || `SKU-${item.id.slice(-6)}`,
        units: item.quantity,
        selling_price: Number(item.price),
        discount: 0,
      }));

      // 5. Determine and Validate Payment Method (COD vs Prepaid)
      const pmValidation = this.validatePaymentMethod(order.paymentMethod);
      if (!pmValidation.valid) {
        return {
          success: false,
          message: pmValidation.errors.join(', '),
          statusCode: 400,
          error: {
            code: 'INVALID_PAYMENT_METHOD',
            details: pmValidation.errors,
          },
        };
      }
      const paymentMethodStr: 'COD' | 'Prepaid' = pmValidation.type;

      // Format Date String in YYYY-MM-DD HH:mm format
      const orderDateObj = order.createdAt ? new Date(order.createdAt) : new Date();
      const orderDateStr = orderDateObj.toISOString().replace('T', ' ').slice(0, 16);

      const cleanMobile = (order.address?.mobile || order.user?.mobile || '')
        .replace(/\D/g, '')
        .slice(-10);

      // 6. Build Shiprocket Adhoc Order Payload
      const payload: ShiprocketCreateOrderPayload = {
        order_id: order.orderNumber,
        order_date: orderDateStr,
        pickup_location: options?.pickupLocation || SHIPROCKET_CONSTANTS.DEFAULTS.PICKUP_LOCATION,
        billing_customer_name: order.address?.fullName || order.user?.name || 'Customer',
        billing_last_name: '',
        billing_address: order.address.addressLine1,
        billing_address_2: order.address.addressLine2 || '',
        billing_city: order.address.city,
        billing_pincode: order.address.pincode,
        billing_state: order.address.state,
        billing_country: 'India',
        billing_email: order.user?.email || 'customer@navyacollection.com',
        billing_phone: cleanMobile,
        shipping_is_billing: true,
        order_items: shiprocketItems,
        payment_method: paymentMethodStr,
        shipping_charges: Number(order.shippingAmount || 0),
        total_discount: Number(order.discountAmount || 0),
        sub_total: Number(order.finalAmount),
        length,
        breadth,
        height,
        weight: packageWeight,
      };

      console.log(`[SHIPMENT_DISPATCH] Dispatching adhoc order creation to Shiprocket API...`, {
        orderId: order.orderNumber,
        paymentMethod: paymentMethodStr,
        itemsCount: shiprocketItems.length,
        pincode: order.address.pincode,
      });

      // 7. Call Shiprocket API
      const response = await shiprocketClient.post<ShiprocketCreateOrderResponse>(
        SHIPROCKET_CONSTANTS.ENDPOINTS.CREATE_ORDER,
        payload,
      );

      const resData = response.data;
      if (!resData || !resData.shipment_id || !resData.order_id) {
        throw new Error('Received invalid response payload from Shiprocket API.');
      }

      const shiprocketOrderId = String(resData.order_id);
      const shiprocketShipmentId = String(resData.shipment_id);
      const awbCode = resData.awb_code || undefined;
      const courierName = resData.courier_name || undefined;

      // 8. Update Order in PostgreSQL DB
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shiprocketOrderId,
          shiprocketShipmentId,
          awbCode,
          courierName,
          shippingStatus: 'PENDING',
          orderStatus: order.orderStatus === 'PENDING' ? 'CONFIRMED' : order.orderStatus,
        },
      });

      // 9. Trigger AWB Generation asynchronously after shipment creation
      AwbService.generateAwbForOrder(order.id).catch((awbErr) => {
        console.error('[AUTO_AWB_TRIGGER_ERROR]', awbErr);
      });

      console.log(
        `[SHIPMENT_SUCCESS] Shipment created successfully! Shiprocket Order ID: ${shiprocketOrderId}, Shipment ID: ${shiprocketShipmentId}`,
      );

      return {
        success: true,
        message: 'Shipment created successfully via Shiprocket.',
        statusCode: 201,
        data: {
          orderId: order.id,
          shiprocketOrderId,
          shiprocketShipmentId,
          status: resData.status || 'NEW',
          paymentMethod: paymentMethodStr,
          courierName,
          awbCode,
        },
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create shipment on Shiprocket.';

      console.error(`[SHIPMENT_CREATE_ERROR] Order ${orderIdOrNumber}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        statusCode: error.response?.status || 500,
        error: {
          code: 'SHIPROCKET_SHIPMENT_FAILED',
          details: error.response?.data || error.message,
        },
      };
    }
  }

  /**
   * Fetches shipment details from database or Shiprocket API.
   */
  static async getShipmentDetails(orderIdOrShipmentId: string): Promise<StandardShippingResponse> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: orderIdOrShipmentId },
            { orderNumber: orderIdOrShipmentId },
            { shiprocketShipmentId: orderIdOrShipmentId },
            { shiprocketOrderId: orderIdOrShipmentId },
          ],
        },
        include: { address: true, items: true },
      });

      if (!order || !order.shiprocketShipmentId) {
        return {
          success: false,
          message: 'Shipment not found for the given ID.',
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Shipment details fetched successfully.',
        statusCode: 200,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          shiprocketOrderId: order.shiprocketOrderId,
          shiprocketShipmentId: order.shiprocketShipmentId,
          awbCode: order.awbCode,
          courierName: order.courierName,
          shippingStatus: order.shippingStatus,
          estimatedDelivery: order.estimatedDelivery,
          trackingNumber: order.trackingNumber,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch shipment details.',
        statusCode: 500,
      };
    }
  }

  /**
   * Cancels shipment on Shiprocket if order is cancelled.
   */
  static async cancelShipment(orderIdOrShipmentId: string): Promise<StandardShippingResponse> {
    try {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: orderIdOrShipmentId },
            { orderNumber: orderIdOrShipmentId },
            { shiprocketShipmentId: orderIdOrShipmentId },
          ],
        },
      });

      if (!order || !order.shiprocketOrderId) {
        return {
          success: false,
          message: 'Shipment record not found for cancellation.',
          statusCode: 404,
        };
      }

      // Call Shiprocket cancel order endpoint
      await shiprocketClient.post('/orders/cancel', {
        ids: [Number(order.shiprocketOrderId)],
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          shippingStatus: 'FAILED',
          orderStatus: 'CANCELLED',
        },
      });

      return {
        success: true,
        message: 'Shipment cancelled successfully.',
        statusCode: 200,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to cancel shipment.',
        statusCode: error.response?.status || 500,
      };
    }
  }
}

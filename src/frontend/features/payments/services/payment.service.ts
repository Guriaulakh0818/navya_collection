import { PaymentMethod, PaymentStatus } from '@prisma/client';

import { OrderRepository } from '@/features/orders/repositories/order.repository';
import { OrderPreviewService } from '@/features/orders/services/order-preview.service';
import { getRazorpayConfig, getRazorpayInstance, verifyRazorpaySignature } from '@/lib/razorpay';

import { PaymentIntentRepository } from '../repositories/payment-intent.repository';
import { PaymentRepository } from '../repositories/payment.repository';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export interface CreatePaymentOrderInput {
  addressId: string;
  couponCode?: string;
  shippingMethodCode?: string;
  items?: any[];
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  addressId: string;
  couponCode?: string;
  shippingMethodCode?: string;
  items?: any[];
}

export class PaymentService {
  /**
   * Creates a Razorpay Order on Razorpay Servers with 100% Authoritative Server-side Amount Calculation
   * and persists a durable PaymentIntent in the database to prevent orphaned payments (BM-06).
   */
  static async createPaymentOrder(
    userId: string,
    input: CreatePaymentOrderInput,
  ): Promise<ServiceResponse> {
    try {
      if (!input.addressId) {
        return {
          success: false,
          message: 'Delivery address is required to create a payment order.',
          statusCode: 400,
        };
      }

      // 1. Generate Authoritative Order Preview & Server Pricing (BM-05 / BM-06 Dynamic GST)
      const previewRes = await OrderPreviewService.generatePreview(userId, {
        addressId: input.addressId,
        couponCode: input.couponCode,
        shippingMethodCode: input.shippingMethodCode || 'STANDARD',
        paymentMethod: 'PREPAID',
        items: input.items,
      });

      if (!previewRes.success || !previewRes.data) {
        return previewRes;
      }

      const preview = previewRes.data;

      if (!preview.isServiceable) {
        return {
          success: false,
          message: 'The selected delivery address is non-serviceable for shipping.',
          statusCode: 400,
        };
      }

      if (preview.items.length === 0) {
        return {
          success: false,
          message: 'Your cart is empty.',
          statusCode: 400,
        };
      }

      // 2. Authoritative Grand Total in Paise (1 INR = 100 Paise)
      const amountInPaise = Math.round(Number(preview.grandTotal) * 100);

      if (amountInPaise <= 0) {
        return {
          success: false,
          message: 'Order total must be greater than zero.',
          statusCode: 400,
        };
      }

      // 3. Razorpay SDK Order Creation
      const config = getRazorpayConfig();
      let rzpOrder: any = null;

      try {
        const razorpay = getRazorpayInstance();
        rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now().toString().slice(-8)}`,
          notes: {
            userId,
            addressId: input.addressId,
            couponCode: input.couponCode || '',
            itemCount: String(preview.itemCount || preview.items.length),
          },
        });
      } catch (err: any) {
        // Fallback for non-production environments with dummy keys
        if (
          process.env.NODE_ENV !== 'production' &&
          (!config.keyId || config.keyId === 'rzp_test_placeholder')
        ) {
          console.warn('[RAZORPAY_CREATE_ORDER_WARN] Using test checkout order:', err?.message);
          rzpOrder = {
            id: `order_test_${Date.now()}`,
            amount: amountInPaise,
            currency: 'INR',
          };
        } else {
          throw err;
        }
      }

      // 4. Persist Durable Server-Side PaymentIntent (DECISION 1 — Orphan Payment Prevention)
      const paymentIntent = await PaymentIntentRepository.createIntent({
        userId,
        addressId: input.addressId,
        razorpayOrderId: rzpOrder.id,
        amount: preview.grandTotal,
        currency: rzpOrder.currency || 'INR',
        subtotal: preview.subtotal,
        discountAmount: preview.discount,
        shippingAmount: preview.shipping,
        taxAmount: preview.tax,
        finalAmount: preview.grandTotal,
        couponCode: input.couponCode || null,
        shippingMethodCode: input.shippingMethodCode || 'STANDARD',
        cartSnapshot: preview.items,
        shippingSnapshot: preview.shippingData || null,
        taxSnapshot: preview.taxBreakdown || null,
      });

      return {
        success: true,
        message: 'Razorpay order created successfully.',
        statusCode: 200,
        data: {
          razorpayOrderId: rzpOrder.id,
          amount: rzpOrder.amount, // In paise
          currency: rzpOrder.currency || 'INR',
          keyId: config.keyId,
          paymentIntentId: paymentIntent.id,
          customer: preview.customer,
          preview,
        },
      };
    } catch (error: any) {
      console.error('[RAZORPAY_CREATE_ORDER_SERVICE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to create Razorpay payment order.',
        statusCode: 500,
      };
    }
  }

  /**
   * Verifies Razorpay Payment Signature and Atomically Creates DB Order & Clears Cart.
   * Cryptographically secure HMAC-SHA256 signature verification (No demo bypass in production).
   */
  static async verifyPaymentSignatureAndFulfill(
    userId: string,
    input: VerifyPaymentInput,
  ): Promise<ServiceResponse> {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, addressId, couponCode } =
        input;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return {
          success: false,
          message: 'Missing required Razorpay payment verification parameters.',
          statusCode: 400,
        };
      }

      // 1. Verify HMAC SHA256 Signature (Cryptographically Secure - No Demo Bypass in Production)
      const isValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      );

      if (!isValid) {
        console.warn(
          `[INVALID_PAYMENT_SIGNATURE_ATTEMPT] User: ${userId}, RazorpayOrderId: ${razorpayOrderId}`,
        );
        return {
          success: false,
          message: 'Payment verification failed. Invalid digital signature detected.',
          statusCode: 400,
        };
      }

      // 2. Check Idempotency (Prevent Duplicate Orders)
      const existingOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);
      if (existingOrder) {
        return {
          success: true,
          message: 'Payment verified successfully.',
          statusCode: 200,
          data: {
            orderId: existingOrder.id,
            orderNumber: existingOrder.orderNumber,
            finalAmount: existingOrder.finalAmount,
          },
        };
      }

      // 3. Recalculate Server-side Order Totals (BM-05 / BM-06 Dynamic GST)
      const previewRes = await OrderPreviewService.generatePreview(userId, {
        addressId,
        couponCode,
        shippingMethodCode: input.shippingMethodCode || 'STANDARD',
        paymentMethod: 'PREPAID',
        items: input.items,
      });

      if (!previewRes.success || !previewRes.data) {
        return previewRes;
      }

      const preview = previewRes.data;

      // 4. Create Database Order Atomically
      const order = await OrderRepository.createOrderWithItems({
        userId,
        addressId,
        totalAmount: preview.subtotal,
        discountAmount: preview.discount,
        couponCode: preview.appliedCoupon?.code || couponCode || null,
        couponId: preview.appliedCoupon?.couponId || null,
        couponType: preview.appliedCoupon?.couponType || null,
        couponFundingType: preview.appliedCoupon?.fundingType || null,
        shippingAmount: preview.shipping,
        taxAmount: preview.tax,
        finalAmount: preview.grandTotal,
        paymentMethod: PaymentMethod.RAZORPAY,
        paymentStatus: PaymentStatus.PAID,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        items: preview.items.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.name,
          sku: i.sku || i.productId,
          price: i.price,
          quantity: i.quantity,
          total: i.subtotal,
          compareAtPrice: i.compareAtPrice,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
        })),
      });

      // 5. Update PaymentIntent status to CAPTURED
      await PaymentIntentRepository.updateStatus(razorpayOrderId, 'CAPTURED', {
        razorpayPaymentId,
        razorpaySignature,
        masterOrderId: order?.id,
      }).catch((piErr) => {
        console.warn('[PAYMENT_INTENT_UPDATE_WARN]', piErr);
      });

      return {
        success: true,
        message: 'Payment verified and order placed successfully!',
        statusCode: 200,
        data: {
          orderId: order?.id,
          orderNumber: order?.orderNumber,
          finalAmount: order?.finalAmount,
        },
      };
    } catch (error: any) {
      console.error('[RAZORPAY_VERIFY_SERVICE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Payment verification failed due to a server error.',
        statusCode: 500,
      };
    }
  }

  /**
   * Recovers and fulfills an orphaned Razorpay payment using the durable PaymentIntent snapshot (BM-06).
   * Used by the Razorpay webhook when client disconnects or closes the browser before /verify executes.
   */
  static async recoverAndFulfillOrphanPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature?: string,
  ): Promise<any> {
    // 1. Idempotency Check
    const existingOrder = await OrderRepository.findByRazorpayOrderId(razorpayOrderId);
    if (existingOrder) {
      if (existingOrder.paymentStatus !== PaymentStatus.PAID) {
        await OrderRepository.updatePaymentStatus(
          existingOrder.id,
          PaymentStatus.PAID,
          razorpayPaymentId,
        );
      }
      return existingOrder;
    }

    // 2. Locate Durable PaymentIntent
    const intent = await PaymentIntentRepository.findByRazorpayOrderId(razorpayOrderId);
    if (!intent) {
      console.warn(
        `[ORPHAN_RECOVERY_WARNING] No PaymentIntent found for Razorpay Order: ${razorpayOrderId}`,
      );
      return null;
    }

    if (intent.status === 'CAPTURED' && intent.masterOrderId) {
      return await OrderRepository.findById(intent.masterOrderId);
    }

    const items = Array.isArray(intent.cartSnapshot) ? intent.cartSnapshot : [];

    // 3. Fulfill Order using Immutable PaymentIntent Snapshot
    const order = await OrderRepository.createOrderWithItems({
      userId: intent.userId,
      addressId: intent.addressId,
      totalAmount: Number(intent.subtotal),
      discountAmount: Number(intent.discountAmount),
      couponCode: intent.couponCode || null,
      shippingAmount: Number(intent.shippingAmount),
      taxAmount: Number(intent.taxAmount),
      finalAmount: Number(intent.finalAmount),
      paymentMethod: PaymentMethod.RAZORPAY,
      paymentStatus: PaymentStatus.PAID,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || intent.razorpaySignature || 'webhook_verified',
      notes: 'Recovered via Razorpay Webhook from durable PaymentIntent snapshot',
      items: items.map((i: any) => ({
        productId: i.productId,
        variantId: i.variantId,
        name: i.name || 'Recovered Fashion Item',
        sku: i.sku || i.productId || 'SKU-ITEM',
        price: Number(i.price),
        quantity: Number(i.quantity),
        total: Number(i.subtotal || i.price * i.quantity),
        compareAtPrice: i.compareAtPrice,
        taxRate: i.taxRate,
        taxAmount: i.taxAmount,
      })),
    });

    // 4. Mark PaymentIntent as CAPTURED
    await PaymentIntentRepository.updateStatus(razorpayOrderId, 'CAPTURED', {
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'webhook_verified',
      masterOrderId: order?.id,
    });

    return order;
  }

  /**
   * Handles Cash On Delivery (COD) Order Placement.
   */
  static async createCodOrder(
    userId: string,
    input: CreatePaymentOrderInput,
  ): Promise<ServiceResponse> {
    try {
      if (!input.addressId) {
        return {
          success: false,
          message: 'Delivery address is required.',
          statusCode: 400,
        };
      }

      // Recalculate Server-side Order Totals (BM-05 COD threshold ₹1,999)
      const previewRes = await OrderPreviewService.generatePreview(userId, {
        addressId: input.addressId,
        couponCode: input.couponCode,
        shippingMethodCode: input.shippingMethodCode || 'STANDARD',
        paymentMethod: 'COD',
        items: input.items,
      });

      if (!previewRes.success || !previewRes.data) {
        return previewRes;
      }

      const preview = previewRes.data;

      // 2. Authoritative ₹5,000 Selling-Price Subtotal Cap (BM-07 Section 2)
      // The ₹5,000 limit applies ONLY to the product selling-price subtotal.
      if (preview.subtotal > 5000 || !preview.isCodEligible) {
        return {
          success: false,
          message:
            'Cash on Delivery is unavailable for orders where product selling price exceeds ₹5,000.',
          statusCode: 400,
        };
      }

      if (preview.items.length === 0) {
        return {
          success: false,
          message: 'Your cart is empty.',
          statusCode: 400,
        };
      }

      // 3. Atomically Create Order in Database with Inventory Decrement
      const order = await OrderRepository.createOrderWithItems({
        userId,
        addressId: input.addressId,
        totalAmount: preview.subtotal,
        discountAmount: preview.discount,
        couponCode: preview.appliedCoupon?.code || input.couponCode || null,
        couponId: preview.appliedCoupon?.couponId || null,
        couponType: preview.appliedCoupon?.couponType || null,
        couponFundingType: preview.appliedCoupon?.fundingType || null,
        shippingAmount: preview.shipping,
        taxAmount: preview.tax,
        codFee: preview.codFee,
        codFeeTax: preview.codFeeTax,
        finalAmount: preview.grandTotal,
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.PENDING,
        items: preview.items.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.name,
          sku: i.sku || i.productId,
          price: i.price,
          quantity: i.quantity,
          total: i.subtotal,
          compareAtPrice: i.compareAtPrice,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
        })),
      });

      if (!order || !order.id) {
        return {
          success: false,
          message: 'Failed to record COD order in system.',
          statusCode: 500,
        };
      }

      // 4. Initiate Shiprocket COD Verification Flow (BM-07 Section 6)
      const { ShiprocketCodService } =
        await import('@/backend/services/shipping/shiprocket-cod.service');
      await ShiprocketCodService.initiateVerification(order.id).catch((verErr: any) => {
        console.warn('[SHIPROCKET_COD_VERIFICATION_INITIATE_WARN]', verErr?.message);
      });

      return {
        success: true,
        message: 'COD Order placed successfully! Pending Shiprocket buyer verification.',
        statusCode: 200,
        data: {
          id: order.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          finalAmount: order.finalAmount,
          codFee: (order as any).codFee || 0,
          codVerificationStatus: 'PENDING',
        },
      };
    } catch (error: any) {
      console.error('[COD_CREATE_ORDER_SERVICE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to place COD order.',
        statusCode: 500,
      };
    }
  }
}

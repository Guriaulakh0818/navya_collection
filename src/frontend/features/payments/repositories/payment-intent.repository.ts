import { prisma } from '@/lib/prisma';

export interface CreatePaymentIntentInput {
  userId: string;
  addressId: string;
  razorpayOrderId: string;
  amount: number; // in INR
  currency?: string;
  subtotal: number;
  discountAmount?: number;
  shippingAmount?: number;
  taxAmount?: number;
  finalAmount: number;
  couponCode?: string | null;
  shippingMethodCode?: string;
  cartSnapshot: any;
  shippingSnapshot?: any;
  taxSnapshot?: any;
  customerNotes?: string | null;
  metadata?: any;
  expiresInMinutes?: number;
}

export class PaymentIntentRepository {
  /**
   * Generates a unique traceable payment intent reference number.
   * e.g. NC-PI-261003-4589
   */
  static generateIntentNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `NC-PI-${timestamp}-${randomSuffix}`;
  }

  /**
   * Creates a durable server-side PaymentIntent before customer opens Razorpay checkout (BM-06).
   */
  static async createIntent(input: CreatePaymentIntentInput) {
    const intentNumber = this.generateIntentNumber();
    const expiryMinutes = input.expiresInMinutes || 60;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return prisma.paymentIntent.create({
      data: {
        intentNumber,
        userId: input.userId,
        addressId: input.addressId,
        razorpayOrderId: input.razorpayOrderId,
        amount: input.amount,
        currency: input.currency || 'INR',
        status: 'PAYMENT_PENDING',
        subtotal: input.subtotal,
        discountAmount: input.discountAmount || 0,
        shippingAmount: input.shippingAmount || 0,
        taxAmount: input.taxAmount || 0,
        finalAmount: input.finalAmount,
        couponCode: input.couponCode || null,
        shippingMethodCode: input.shippingMethodCode || 'STANDARD',
        cartSnapshot: input.cartSnapshot,
        shippingSnapshot: input.shippingSnapshot || undefined,
        taxSnapshot: input.taxSnapshot || undefined,
        customerNotes: input.customerNotes || null,
        metadata: input.metadata || undefined,
        expiresAt,
      },
    });
  }

  /**
   * Finds a PaymentIntent by Razorpay Order ID.
   */
  static async findByRazorpayOrderId(razorpayOrderId: string) {
    return prisma.paymentIntent.findUnique({
      where: { razorpayOrderId },
      include: {
        user: true,
        address: true,
        masterOrder: true,
      },
    });
  }

  /**
   * Updates PaymentIntent status (e.g. CAPTURED, FAILED, CANCELLED).
   */
  static async updateStatus(
    razorpayOrderId: string,
    status: string,
    extra?: {
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      masterOrderId?: string;
      failureReason?: string;
    },
  ) {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (extra?.razorpayPaymentId) {
      updateData.razorpayPaymentId = extra.razorpayPaymentId;
    }
    if (extra?.razorpaySignature) {
      updateData.razorpaySignature = extra.razorpaySignature;
    }
    if (extra?.masterOrderId) {
      updateData.masterOrderId = extra.masterOrderId;
      updateData.fulfilledAt = new Date();
    }
    if (extra?.failureReason) {
      updateData.failureReason = extra.failureReason;
      updateData.failedAt = new Date();
    }

    return prisma.paymentIntent.update({
      where: { razorpayOrderId },
      data: updateData,
    });
  }

  /**
   * Idempotently records an incoming Razorpay Webhook Event in the database.
   */
  static async recordWebhookEvent(params: {
    eventId: string;
    eventType: string;
    razorpayOrderId?: string | null;
    razorpayPaymentId?: string | null;
    payload: any;
    status?: string;
    errorMessage?: string | null;
  }) {
    try {
      return await prisma.paymentWebhookEvent.create({
        data: {
          eventId: params.eventId,
          eventType: params.eventType,
          razorpayOrderId: params.razorpayOrderId || null,
          razorpayPaymentId: params.razorpayPaymentId || null,
          status: params.status || 'PROCESSED',
          payload: params.payload,
          errorMessage: params.errorMessage || null,
        },
      });
    } catch (err: any) {
      // If already recorded (unique constraint), return existing
      return await prisma.paymentWebhookEvent.findUnique({
        where: { eventId: params.eventId },
      });
    }
  }

  /**
   * Checks if a webhook event ID has already been successfully processed.
   */
  static async isWebhookEventProcessed(eventId: string): Promise<boolean> {
    const existing = await prisma.paymentWebhookEvent.findUnique({
      where: { eventId },
    });
    return Boolean(existing && existing.status === 'PROCESSED');
  }
}

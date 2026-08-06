import { PaymentStatus } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export interface CreateTransactionInput {
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  method?: string;
  errorCode?: string;
  errorDescription?: string;
  payload?: any;
}

export class PaymentRepository {
  /**
   * Creates a new PaymentTransaction record in the database.
   */
  static async createTransaction(input: CreateTransactionInput) {
    return prisma.paymentTransaction.create({
      data: {
        orderId: input.orderId,
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        amount: input.amount,
        currency: input.currency || 'INR',
        status: input.status,
        method: input.method || 'RAZORPAY',
        errorCode: input.errorCode,
        errorDescription: input.errorDescription,
        payload: input.payload || undefined,
      },
    });
  }

  /**
   * Finds a PaymentTransaction by Razorpay Order ID.
   */
  static async findByRazorpayOrderId(razorpayOrderId: string) {
    return prisma.paymentTransaction.findFirst({
      where: { razorpayOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds a PaymentTransaction by Razorpay Payment ID.
   */
  static async findByRazorpayPaymentId(razorpayPaymentId: string) {
    return prisma.paymentTransaction.findFirst({
      where: { razorpayPaymentId },
    });
  }
}

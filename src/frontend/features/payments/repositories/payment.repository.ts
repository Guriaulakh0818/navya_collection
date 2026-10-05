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
  gatewayFee?: number;
  gatewayTax?: number;
  netAmount?: number;
  gatewayFeeStatus?: string;
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
        gatewayFee: input.gatewayFee ?? 0,
        gatewayTax: input.gatewayTax ?? 0,
        netAmount: input.netAmount ?? input.amount,
        gatewayFeeStatus: input.gatewayFeeStatus || 'ESTIMATED',
        errorCode: input.errorCode,
        errorDescription: input.errorDescription,
        payload: input.payload || undefined,
      },
    });
  }

  /**
   * Updates payment gateway fee details idempotently.
   */
  static async updateTransactionFee(
    razorpayPaymentId: string,
    data: {
      gatewayFee: number;
      gatewayTax?: number;
      netAmount?: number;
      gatewayFeeStatus?: string;
    },
  ) {
    return prisma.paymentTransaction.updateMany({
      where: { razorpayPaymentId },
      data: {
        gatewayFee: data.gatewayFee,
        gatewayTax: data.gatewayTax ?? 0,
        netAmount: data.netAmount ?? undefined,
        gatewayFeeStatus: data.gatewayFeeStatus || 'ACTUAL',
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

export const PAYMENT_METHODS = {
  COD: 'cod',
  ONLINE: 'online',
  UPI: 'upi',
  CARD: 'card',
  WALLET: 'wallet',
  NET_BANKING: 'netbanking',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
} as const;

export const RAZORPAY_CURRENCY = 'INR';

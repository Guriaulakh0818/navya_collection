import crypto from 'crypto';
import Razorpay from 'razorpay';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayConfig() {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    (process.env.NODE_ENV === 'production' ? '' : 'rzp_test_placeholder');

  const keySecret =
    process.env.RAZORPAY_KEY_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : 'dev_key_secret_placeholder');
  const webhookSecret =
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    (process.env.NODE_ENV === 'production' ? '' : 'dev_webhook_secret_placeholder');

  return { keyId, keySecret, webhookSecret };
}

export function getRazorpayClient(): Razorpay {
  const config = getRazorpayConfig();

  if (!config.keyId || !config.keySecret) {
    throw new Error(
      '[RAZORPAY_CONFIG_ERROR] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment variables.',
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }
  return razorpayInstance;
}

// Alias for backwards compatibility
export const getRazorpayInstance = getRazorpayClient;

/**
 * Verifies Razorpay Payment Signature using HMAC-SHA256.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) === signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  try {
    const { keySecret } = getRazorpayConfig();
    const payload = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(payload).digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(new Uint8Array(expectedBuffer), new Uint8Array(signatureBuffer));
  } catch (err) {
    console.error('[RAZORPAY_SIGNATURE_VERIFICATION_ERROR]', err);
    return false;
  }
}

/**
 * Verifies Razorpay Webhook Signature using HMAC-SHA256.
 * Formula: HMAC_SHA256(raw_body, webhook_secret) === x-razorpay-signature
 */
export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  try {
    const { webhookSecret } = getRazorpayConfig();
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(new Uint8Array(expectedBuffer), new Uint8Array(signatureBuffer));
  } catch (err) {
    console.error('[RAZORPAY_WEBHOOK_SIGNATURE_ERROR]', err);
    return false;
  }
}

export interface RazorpayRefundResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes?: Record<string, any>;
  receipt?: string;
  status: 'pending' | 'processed' | 'failed';
  speed_processed?: string;
  speed_requested?: string;
  created_at: number;
}

/**
 * Initiates an official Razorpay Refund via Razorpay API (BM-06).
 */
export async function createRazorpayRefund(params: {
  paymentId: string;
  amountInPaise: number;
  notes?: Record<string, any>;
  speed?: 'normal' | 'optimum';
}): Promise<RazorpayRefundResponse> {
  const { paymentId, amountInPaise, notes, speed = 'optimum' } = params;

  if (!paymentId) {
    throw new Error('[RAZORPAY_REFUND_ERROR] Missing paymentId for refund.');
  }
  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error('[RAZORPAY_REFUND_ERROR] Invalid refund amount in paise.');
  }

  const config = getRazorpayConfig();

  // Test mode fallback when using dummy credentials or test payment IDs
  if (
    process.env.NODE_ENV !== 'production' &&
    (!config.keyId ||
      config.keyId === 'rzp_test_placeholder' ||
      paymentId.startsWith('pay_demo_') ||
      paymentId.startsWith('pay_test_') ||
      paymentId.startsWith('pay_partial_'))
  ) {
    return {
      id: `rfnd_test_${Date.now()}`,
      entity: 'refund',
      amount: amountInPaise,
      currency: 'INR',
      payment_id: paymentId,
      notes: notes || {},
      status: 'processed',
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  try {
    const razorpay = getRazorpayClient();
    const refundResponse = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      notes,
      speed,
    });

    return refundResponse as any;
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        id: `rfnd_test_${Date.now()}`,
        entity: 'refund',
        amount: amountInPaise,
        currency: 'INR',
        payment_id: paymentId,
        notes: notes || {},
        status: 'processed',
        created_at: Math.floor(Date.now() / 1000),
      };
    }
    throw err;
  }
}

/**
 * Fetches Razorpay Payment Entity by ID.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<any> {
  if (!paymentId) return null;
  const config = getRazorpayConfig();

  if (
    process.env.NODE_ENV !== 'production' &&
    (!config.keyId || config.keyId === 'rzp_test_placeholder' || paymentId.startsWith('pay_demo_'))
  ) {
    return {
      id: paymentId,
      entity: 'payment',
      amount: 100000,
      currency: 'INR',
      status: 'captured',
      method: 'upi',
      fee: 2000, // 20 INR
      tax: 360, // 3.6 INR
    };
  }

  const razorpay = getRazorpayClient();
  return await razorpay.payments.fetch(paymentId);
}

export interface RazorpayPayoutResponse {
  id: string;
  entity: string;
  fund_account_id?: string;
  amount: number;
  currency: string;
  status: 'queued' | 'pending' | 'processing' | 'processed' | 'reversed' | 'cancelled' | 'rejected';
  purpose: string;
  utr?: string;
  mode: string;
  reference_id: string;
  notes?: Record<string, any>;
  created_at: number;
}

/**
 * Initiates an official Razorpay Payout for COD Customer Refunds (BM-07).
 * Disburses funds directly to customer bank account or UPI ID.
 */
export async function createRazorpayPayout(params: {
  amountInPaise: number;
  referenceId: string;
  beneficiaryName: string;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  upiId?: string | null;
  notes?: Record<string, any>;
}): Promise<RazorpayPayoutResponse> {
  const { amountInPaise, referenceId, beneficiaryName, bankAccountNumber, bankIfsc, upiId, notes } =
    params;

  if (!amountInPaise || amountInPaise <= 0) {
    throw new Error('[RAZORPAY_PAYOUT_ERROR] Invalid payout amount.');
  }
  if (!referenceId) {
    throw new Error('[RAZORPAY_PAYOUT_ERROR] Missing referenceId for idempotent payout.');
  }

  if (process.env.NODE_ENV === 'production' && !upiId && (!bankAccountNumber || !bankIfsc)) {
    throw new Error(
      '[RAZORPAY_PAYOUT_ERROR] Valid customer refund destination required. Provide either UPI ID or Bank Account Number with IFSC.',
    );
  }

  const mode = upiId ? 'UPI' : 'IMPS';
  const config = getRazorpayConfig();

  // Test mode fallback when using development placeholder credentials
  if (
    process.env.NODE_ENV !== 'production' &&
    (!config.keyId || config.keyId === 'rzp_test_placeholder')
  ) {
    return {
      id: `pout_test_${Date.now()}`,
      entity: 'payout',
      amount: amountInPaise,
      currency: 'INR',
      status: 'processed',
      purpose: 'refund',
      utr: `UTR${Date.now()}`,
      mode,
      reference_id: referenceId,
      notes: notes || {},
      created_at: Math.floor(Date.now() / 1000),
    };
  }

  if (!config.keyId || !config.keySecret) {
    throw new Error(
      '[RAZORPAY_PAYOUT_ERROR] Production credentials missing for Razorpay Payout execution.',
    );
  }

  try {
    const razorpay: any = getRazorpayClient();
    // RazorpayX Payout API or Razorpay Payouts
    if (razorpay.payouts && typeof razorpay.payouts.create === 'function') {
      const payoutRes = await razorpay.payouts.create({
        account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER || '2323230032549242',
        amount: amountInPaise,
        currency: 'INR',
        mode,
        purpose: 'refund',
        reference_id: referenceId,
        narration: 'Navya Refund',
        notes,
        ...(upiId
          ? {
              fund_account: {
                account_type: 'vpa',
                vpa: { address: upiId },
                contact: { name: beneficiaryName, type: 'customer' },
              },
            }
          : {
              fund_account: {
                account_type: 'bank_account',
                bank_account: {
                  name: beneficiaryName,
                  ifsc: bankIfsc,
                  account_number: bankAccountNumber,
                },
                contact: { name: beneficiaryName, type: 'customer' },
              },
            }),
      });
      return payoutRes as RazorpayPayoutResponse;
    }

    throw new Error('[RAZORPAY_PAYOUT_ERROR] Razorpay Payouts module not available in client.');
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        id: `pout_test_${Date.now()}`,
        entity: 'payout',
        amount: amountInPaise,
        currency: 'INR',
        status: 'processed',
        purpose: 'refund',
        utr: `UTR${Date.now()}`,
        mode,
        reference_id: referenceId,
        notes: notes || {},
        created_at: Math.floor(Date.now() / 1000),
      };
    }
    throw err;
  }
}

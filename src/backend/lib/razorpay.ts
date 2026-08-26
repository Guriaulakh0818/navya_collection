import crypto from 'crypto';
import Razorpay from 'razorpay';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isTestMode: boolean;
}

/**
 * Validates and retrieves Razorpay Environment Variables.
 */
export function getRazorpayConfig(): RazorpayConfig {
  const keyId =
    process.env.RAZORPAY_KEY_ID ||
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    'rzp_test_TUSsl0DgRczLN7';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'a6z4ZPaOIyai9gc1Twwsq8sU';
  const webhookSecret =
    process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_navya_collection_webhook_secret_67890';

  const isTestMode = keyId.startsWith('rzp_test_');

  return {
    keyId,
    keySecret,
    webhookSecret,
    isTestMode,
  };
}

let razorpayInstance: Razorpay | null = null;

/**
 * Gets or initializes singleton Razorpay SDK Instance.
 */
export function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const config = getRazorpayConfig();
    razorpayInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }
  return razorpayInstance;
}

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

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8'),
    );
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

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8'),
    );
  } catch (err) {
    console.error('[RAZORPAY_WEBHOOK_SIGNATURE_ERROR]', err);
    return false;
  }
}

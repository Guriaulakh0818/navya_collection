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

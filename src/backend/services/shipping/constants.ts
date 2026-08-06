/**
 * Shiprocket Integration - Constants
 * Module 4.6.1, 4.6.2 & 4.6.3 – Setup, Authentication, Shipment Creation & Courier Recommendation
 */

export const SHIPROCKET_CONSTANTS = {
  BASE_URL: 'https://apiv2.shiprocket.in/v1/external',
  ENDPOINTS: {
    AUTH_LOGIN: '/auth/login',
    CREATE_ORDER: '/orders/create/adhoc',
    SERVICEABILITY: '/courier/serviceability/',
    ASSIGN_AWB: '/courier/assign/awb',
    GENERATE_PICKUP: '/courier/generate/pickup',
    TRACK_PICKUP: '/courier/pickup/status',
    TRACK_SHIPMENT: '/courier/track/shipment',
    TRACK_AWB: '/courier/track/awb',
    GENERATE_LABEL: '/courier/generate/label',
  },
  // Shiprocket tokens are valid for 10 days (240 hours).
  // Refresh token automatically after 9 days (216 hours) to prevent expiration.
  TOKEN_TTL_MS: 9 * 24 * 60 * 60 * 1000,
  // Serviceability & Tracking results cached for 15 minutes to reduce API latency & rate limits
  SERVICEABILITY_CACHE_TTL_MS: 15 * 60 * 1000,
  TRACKING_CACHE_TTL_MS: 15 * 60 * 1000,
  REQUEST_TIMEOUT_MS: 15000,
  AWB_RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 1000,
  },
  PICKUP_RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 1000,
  },
  RATE_LIMIT: {
    MAX_REQUESTS_PER_MINUTE: 100,
    WINDOW_MS: 60 * 1000,
  },
  CLIENT_RETRY: {
    MAX_RETRIES: 3,
    INITIAL_DELAY_MS: 500,
    BACKOFF_FACTOR: 2,
  },
  DEFAULTS: {
    PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    PICKUP_PINCODE: process.env.SHIPROCKET_PICKUP_PINCODE || '125050',
    WEIGHT_KG: 0.5,
    LENGTH_CM: 10,
    BREADTH_CM: 10,
    HEIGHT_CM: 10,
    TRACKING_BASE_URL: 'https://shiprocket.co/tracking/',
  },
  ERRORS: {
    MISSING_CREDENTIALS:
      'SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD must be configured in environment variables.',
    AUTH_FAILED: 'Failed to authenticate with Shiprocket API.',
    NETWORK_ERROR: 'Network error communicating with Shiprocket servers.',
    UNAUTHORIZED: 'Shiprocket authentication token expired or invalid.',
    INVALID_ADDRESS: 'Order shipping address is incomplete or invalid.',
    INVALID_PINCODE: 'Order shipping pincode must be a valid 6-digit Indian PIN code.',
    INVALID_WEIGHT: 'Package weight must be greater than 0 kg.',
    INVALID_DIMENSIONS: 'Package dimensions (length, breadth, height) must be greater than 0 cm.',
    ORDER_NOT_FOUND: 'Order not found in database.',
    SHIPMENT_EXISTS: 'Shipment already exists for this order.',
    INVALID_PAYMENT_METHOD:
      'Invalid payment method. Supported payment methods are COD or Prepaid (RAZORPAY, UPI, CARD, NETBANKING).',
    NO_SERVICEABLE_COURIERS:
      'No serviceable courier partners available for the given pincode and weight.',
    NO_SHIPMENT_FOUND:
      'Order does not have an active Shiprocket shipment ID. Create a shipment first.',
    NO_AWB_FOUND:
      'Order does not have an assigned AWB code. Generate AWB prior to scheduling pickup.',
    AWB_GENERATION_FAILED: 'Failed to generate AWB code after maximum retry attempts.',
    PICKUP_REQUEST_FAILED: 'Failed to schedule pickup request after maximum retry attempts.',
    TRACKING_FAILED: 'Failed to retrieve tracking details from Shiprocket.',
    NO_AWB_OR_SHIPMENT: 'Order does not have an AWB code or shipment ID for tracking.',
    NO_SHIPMENT_FOR_LABEL:
      'Order does not have a shipment ID or AWB code to generate a shipping label.',
    LABEL_GENERATION_FAILED: 'Failed to generate shipping label from Shiprocket.',
    RATE_LIMIT_EXCEEDED: 'Shiprocket API rate limit exceeded. Request throttled.',
  },
};

/**
 * Shiprocket Integration - Type Definitions
 * Module 4.6.1, 4.6.2 & 4.6.3 – Setup, Authentication, Shipment Creation & Courier Recommendation
 */

export interface ShiprocketCredentials {
  email: string;
  password?: string;
}

export interface ShiprocketAuthResponse {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  created_at: string;
  token: string;
}

export interface ShiprocketTokenCache {
  token: string;
  expiresAt: number; // Timestamp in ms
  createdAt: number; // Timestamp in ms
}

export interface StandardShippingResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
}

export interface ShiprocketAuthStatus {
  authenticated: boolean;
  user?: {
    email: string;
    companyName?: string;
  };
  expiresAt?: string;
  isCachedToken?: boolean;
}

// ==========================================
// SHIPMENT CREATION TYPES (Module 4.6.2)
// ==========================================

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number | string;
}

export interface ShiprocketCreateOrderPayload {
  order_id: string;
  order_date: string; // YYYY-MM-DD HH:mm
  pickup_location: string;
  channel_id?: string;
  comment?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_address_2?: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: ShiprocketOrderItem[];
  payment_method: 'COD' | 'Prepaid';
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
  total_discount?: number;
  sub_total: number;
  length: number; // in cm
  breadth: number; // in cm
  height: number; // in cm
  weight: number; // in kg
}

export interface ShiprocketCreateOrderResponse {
  order_id: number;
  shipment_id: number;
  status: string;
  status_code: number;
  onboarding_completed_now?: number;
  awb_code?: string;
  courier_company_id?: string;
  courier_name?: string;
  new_channel?: boolean;
}

export interface ShipmentValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CreatedShipmentData {
  orderId: string;
  shiprocketOrderId: string;
  shiprocketShipmentId: string;
  status: string;
  paymentMethod: string;
  courierName?: string;
  awbCode?: string;
}

// ==========================================
// COURIER RECOMMENDATION TYPES (Module 4.6.3)
// ==========================================

export interface ServiceabilityQueryInput {
  pickupPincode?: string;
  deliveryPincode: string;
  weight?: number; // Weight in kg
  isCod?: boolean;
  orderId?: string;
  selectedCourierId?: number; // Optional admin override courier ID
}

export interface CourierCompany {
  id: number;
  name: string;
  minWeight: number;
  rate: number;
  freightCharge: number;
  codCharges: number;
  totalCharge: number;
  etd: string; // e.g. "2-3 Days"
  estimatedDeliveryDays: number;
  rating: number;
  codAvailable: boolean;
  realtimeTracking: boolean;
  recommended: boolean;
  recommendationReason?: string;
  isAdminOverride?: boolean;
}

export interface CourierRecommendationResult {
  pickupPincode: string;
  deliveryPincode: string;
  weight: number;
  isCod: boolean;
  recommendedCourier: CourierCompany | null;
  cheapestCourier: CourierCompany | null;
  fastestCourier: CourierCompany | null;
  availableCouriers: CourierCompany[];
  totalAvailable: number;
  isCachedResponse: boolean;
}

// ==========================================
// AWB GENERATION TYPES (Module 4.6.4)
// ==========================================

export interface ShiprocketAwbAssignPayload {
  shipment_id: string | number;
  courier_id?: string | number;
  status?: string;
}

export interface ShiprocketAwbAssignResponse {
  status: number;
  awb_assign_status: number;
  response?: {
    data?: {
      courier_company_id?: number;
      awb_code?: string;
      courier_name?: string;
      shipment_id?: number | string;
      order_id?: number | string;
      pickup_scheduled_date?: string;
      applied_weight?: number;
      routing_code?: string;
      rto_routing_code?: string;
      tracking_url?: string;
    };
  };
  awb_code?: string;
  courier_name?: string;
}

export interface GenerateAwbOptions {
  courierId?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface AwbGenerationResult {
  orderId: string;
  orderNumber: string;
  shiprocketShipmentId: string;
  awbCode: string;
  courierName: string;
  trackingUrl: string;
  shippingStatus: string;
  orderStatus: string;
  assignedAt: string;
  retriesAttempted: number;
}

// ==========================================
// PICKUP REQUEST TYPES (Module 4.6.5)
// ==========================================

export interface ShiprocketPickupPayload {
  shipment_id: (string | number)[];
  pickup_date?: string[];
}

export interface ShiprocketPickupResponse {
  pickup_status: number;
  response?: {
    pickup_scheduled_date?: string;
    pickup_token_number?: string;
    status?: string;
    pickup_id?: string | number;
  };
  pickup_id?: string | number;
  pickup_token_number?: string;
  pickup_scheduled_date?: string;
}

export interface SchedulePickupOptions {
  pickupDate?: string; // YYYY-MM-DD
  pickupLocation?: string; // Override settings location if needed
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface PickupRequestResult {
  orderId: string;
  orderNumber: string;
  shiprocketShipmentId: string;
  awbCode: string;
  pickupRequestId: string;
  pickupScheduledDate: string;
  pickupTokenNumber: string;
  pickupLocation: string;
  shippingStatus: string;
  scheduledAt: string;
  retriesAttempted: number;
}

export interface PickupStatusResult {
  orderId: string;
  orderNumber: string;
  pickupRequestId: string;
  pickupScheduledDate?: string;
  pickupTokenNumber?: string;
  pickupLocation?: string;
  shippingStatus: string;
  isDevFallback?: boolean;
}

// ==========================================
// ORDER TRACKING TYPES (Module 4.6.6)
// ==========================================

export type NormalizedTrackingStatus =
  | 'PENDING'
  | 'PACKED'
  | 'PICKUP_SCHEDULED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'RTO'
  | 'CANCELLED';

export interface OrderTimelineItem {
  status: NormalizedTrackingStatus;
  label: string;
  description?: string;
  timestamp?: string;
  location?: string;
  activity?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface ShiprocketTrackingCheckpoint {
  date: string;
  status: string;
  activity: string;
  location: string;
  sr_status_label?: string;
}

export interface TrackingResult {
  orderId: string;
  orderNumber: string;
  shiprocketShipmentId?: string;
  awbCode: string;
  courierName: string;
  trackingUrl?: string;
  status?: NormalizedTrackingStatus;
  currentStatus: NormalizedTrackingStatus;
  rawShiprocketStatus?: string;
  statusCode?: number;
  origin?: string;
  originCity?: string;
  destination?: string;
  destinationCity?: string;
  estimatedDeliveryDate?: string;
  etd?: string;
  lastUpdated: string;
  isDelivered?: boolean;
  isCancelled?: boolean;
  isRTO?: boolean;
  isCachedResponse?: boolean;
  isDevFallback?: boolean;
  timeline: OrderTimelineItem[];
  checkpoints: ShiprocketTrackingCheckpoint[];
}

// ==========================================
// SHIPPING LABEL TYPES (Module 4.6.7)
// ==========================================

export interface GenerateLabelOptions {
  forceRefresh?: boolean;
}

export interface ShippingLabelResult {
  orderId: string;
  orderNumber: string;
  shiprocketShipmentId: string;
  awbCode: string;
  courierName: string;
  labelUrl: string;
  downloadUrl: string;
  generatedAt: string;
  isStoredUrl?: boolean;
  isDevFallback?: boolean;
}

// ==========================================
// PRODUCTION READY MODULE TYPES (Module 4.6.8)
// ==========================================

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'METRIC' | 'AUDIT';

export interface LoggerEvent {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

export interface RateLimitConfig {
  maxRequestsPerMinute: number;
  windowMs: number;
}

export interface ShiprocketComponentHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latencyMs?: number;
  message?: string;
  details?: Record<string, any>;
}

export interface ShiprocketHealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  components: {
    database: ShiprocketComponentHealth;
    authentication: ShiprocketComponentHealth;
    shiprocketApi: ShiprocketComponentHealth;
    rateLimiter: ShiprocketComponentHealth;
  };
  metrics: {
    totalRequests: number;
    failedRequests: number;
    rateLimitedRequests: number;
    tokenCached: boolean;
    tokenAgeSeconds: number;
  };
}

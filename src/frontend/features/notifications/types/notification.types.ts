export type NotificationChannel = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'PUSH' | 'IN_APP';

export type NotificationStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'FAILED';

export type NotificationType =
  | 'OTP'
  | 'ORDER_PLACED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_PACKED'
  | 'ORDER_SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'ORDER_CANCELLED'
  | 'WELCOME'
  | 'INVOICE'
  | 'RETURN_APPROVED'
  | 'ADMIN_NEW_ORDER'
  | 'ADMIN_PAYMENT_FAILURE'
  | 'ADMIN_LOW_STOCK'
  | 'ADMIN_OUT_OF_STOCK'
  | 'ORDER_UPDATE'
  | 'PAYMENT_UPDATE'
  | 'PROMOTION'
  | 'SYSTEM'
  | 'RETURN_UPDATE';

export interface NotificationItem {
  id: string;
  userId?: string | null;
  channel: NotificationChannel;
  type: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  provider?: string | null;
  providerResponse?: any;
  metadata?: Record<string, any> | null;
  recipient?: string | null;
  link?: string | null;
  isRead: boolean;
  sentAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface NotificationTemplateVariables {
  customerName?: string;
  orderNumber?: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  amount?: number | string;
  itemsCount?: number;
  products?: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  shippingAddress?: string;
  otpCode?: string;
  reason?: string;
  invoiceUrl?: string;
  returnReason?: string;
  productSku?: string;
  productName?: string;
  stockCount?: number;
  paymentId?: string;
  failureReason?: string;
  customMessage?: string;
  [key: string]: any;
}

export interface SendSMSParams {
  recipientMobile: string;
  type: NotificationType;
  variables: NotificationTemplateVariables;
  userId?: string;
  correlationId?: string;
}

export interface SendEmailParams {
  recipientEmail: string;
  recipientName?: string;
  subject?: string;
  type: NotificationType;
  variables: NotificationTemplateVariables;
  userId?: string;
  correlationId?: string;
}

export interface SendNotificationParams {
  channels?: NotificationChannel[];
  type: NotificationType;
  recipientEmail?: string;
  recipientMobile?: string;
  recipientName?: string;
  userId?: string;
  title?: string;
  message?: string;
  variables?: NotificationTemplateVariables;
  metadata?: Record<string, any>;
  link?: string;
}

export interface AdminAlertParams {
  type: 'ADMIN_NEW_ORDER' | 'ADMIN_PAYMENT_FAILURE' | 'ADMIN_LOW_STOCK' | 'ADMIN_OUT_OF_STOCK';
  title: string;
  message: string;
  variables?: NotificationTemplateVariables;
  metadata?: Record<string, any>;
}

export interface NotificationDispatchResult {
  success: boolean;
  notificationId?: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  provider: string;
  message: string;
  providerResponse?: any;
  error?: any;
}

import type { NotificationTemplateVariables, NotificationType } from '../types/notification.types';

export function formatPrice(amount?: number | string): string {
  if (amount === undefined || amount === null) return '₹0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
}

export function buildSMSMessage(
  type: NotificationType,
  vars: NotificationTemplateVariables,
): string {
  const brand = 'Navya Collection';
  const name = vars.customerName || 'Valued Customer';
  const orderNum = vars.orderNumber || '';
  const amount = formatPrice(vars.amount);
  const tracking = vars.trackingNumber || '';
  const courier = vars.courierName || 'our courier partner';

  switch (type) {
    case 'OTP':
      return `[${brand}] Your verification code is: ${vars.otpCode || '000000'}. Valid for 10 minutes. Do not share with anyone.`;

    case 'ORDER_PLACED':
      return `Hi ${name}, thank you for your order ${orderNum} of ${amount} at ${brand}! We are preparing your items.`;

    case 'ORDER_CONFIRMED':
      return `Hi ${name}, your order ${orderNum} of ${amount} at ${brand} has been confirmed. Processing for dispatch.`;

    case 'ORDER_PACKED':
      return `Hi ${name}, your order ${orderNum} at ${brand} is packed and ready for carrier pickup.`;

    case 'ORDER_SHIPPED':
      return `Hi ${name}, order ${orderNum} has been shipped via ${courier}. AWB/Tracking: ${tracking}. Track your delivery.`;

    case 'OUT_FOR_DELIVERY':
      return `Hi ${name}, order ${orderNum} is OUT FOR DELIVERY today via ${courier}. Please be available to collect your package!`;

    case 'DELIVERED':
      return `Hi ${name}, order ${orderNum} has been DELIVERED successfully! Thank you for shopping with ${brand}.`;

    case 'ORDER_CANCELLED':
      return `Hi ${name}, order ${orderNum} has been cancelled. Reason: ${vars.reason || 'Requested by customer'}. Any paid amount will be refunded.`;

    default:
      return `[${brand}] Update on your request: ${vars.customMessage || 'Thank you for choosing Navya Collection.'}`;
  }
}

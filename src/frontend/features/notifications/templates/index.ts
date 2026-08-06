import type { NotificationTemplateVariables } from '../types/notification.types';
import { formatPrice } from '../utils/template.utils';
import { wrapEmailLayout } from './email-layout';

export function renderWelcomeEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Valued Customer';
  const subject = 'Welcome to Navya Collection! ✨';
  const body = `
    <span class="badge">Welcome Offer Inside</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Welcome to Navya Collection, ${name}!</h2>
    <p>We are thrilled to have you join India's premier destination for affordable luxury gents & kids fashion.</p>
    <p>As a special welcome gift, use coupon code <strong style="color: #F15A25; background: #FFF7ED; padding: 2px 8px; border-radius: 4px;">FIRST200</strong> on your first order above ₹999 to get instant ₹200 OFF!</p>
    <div style="text-align: center;">
      <a href="https://navyacollection.in/shop" class="button">Explore Shop Collection →</a>
    </div>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderOrderConfirmationEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Customer';
  const orderNum = vars.orderNumber || 'NC-ORDER';
  const subject = `Order Confirmed - #${orderNum}`;

  const productRows = (vars.products || [])
    .map(
      (p) => `
    <tr style="border-bottom: 1px solid #F1F5F9;">
      <td style="padding: 12px 0;">
        <strong style="color: #183A73;">${p.name}</strong>
        <br/><span style="font-size: 12px; color: #64748B;">Qty: ${p.quantity}</span>
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 700; color: #183A73;">
        ${formatPrice(p.price * p.quantity)}
      </td>
    </tr>
  `,
    )
    .join('');

  const body = `
    <span class="badge">Order Confirmed</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Thank you for your order, ${name}!</h2>
    <p>Your order <strong style="color: #F15A25;">#${orderNum}</strong> has been successfully placed and confirmed.</p>
    
    <div style="background: #F8FAFC; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;">
      <h3 style="font-size: 15px; color: #183A73; margin-top: 0; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px;">Order Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${productRows || '<tr><td style="padding: 8px 0;">General Apparel Items</td></tr>'}
        <tr>
          <td style="padding: 12px 0; font-weight: 800; color: #183A73; font-size: 15px;">Grand Total</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 800; color: #F15A25; font-size: 16px;">
            ${formatPrice(vars.amount)}
          </td>
        </tr>
      </table>
    </div>

    ${vars.shippingAddress ? `<p><strong>Delivery Address:</strong><br/>${vars.shippingAddress}</p>` : ''}

    <div style="text-align: center;">
      <a href="https://navyacollection.in/account/orders" class="button">Track Order Status →</a>
    </div>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderShippingConfirmationEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Customer';
  const orderNum = vars.orderNumber || 'NC-ORDER';
  const tracking = vars.trackingNumber || 'N/A';
  const courier = vars.courierName || 'Shiprocket Partner';
  const subject = `Order Shipped - #${orderNum}`;

  const body = `
    <span class="badge">Shipment Dispatched</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Your Order is On Its Way! 🚚</h2>
    <p>Hi ${name}, order <strong style="color: #F15A25;">#${orderNum}</strong> has been handed over to <strong>${courier}</strong> for delivery.</p>

    <div style="background: #F8FAFC; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0;">
      <p style="margin: 0 0 8px 0;"><strong>Courier:</strong> ${courier}</p>
      <p style="margin: 0 0 8px 0;"><strong>AWB / Tracking Number:</strong> <span style="font-family: monospace; font-weight: 800; color: #F15A25;">${tracking}</span></p>
      ${vars.estimatedDelivery ? `<p style="margin: 0;"><strong>Estimated Delivery:</strong> ${vars.estimatedDelivery}</p>` : ''}
    </div>

    <div style="text-align: center;">
      <a href="https://navyacollection.in/tracking?awb=${tracking}" class="button">Live Shipment Tracking →</a>
    </div>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderDeliveredEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Customer';
  const orderNum = vars.orderNumber || 'NC-ORDER';
  const subject = `Order Delivered - #${orderNum}`;

  const body = `
    <span class="badge" style="background: #DCFCE7; color: #16A34A; border-color: #BBF7D0;">Successfully Delivered</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Your Package Has Been Delivered! 🎉</h2>
    <p>Hi ${name}, order <strong style="color: #F15A25;">#${orderNum}</strong> was delivered to your address today.</p>
    <p>We hope you love your new outfit! If you have a moment, please rate your items and share your feedback.</p>

    <div style="text-align: center;">
      <a href="https://navyacollection.in/account/orders" class="button">Write a Product Review →</a>
    </div>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderCancelledEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Customer';
  const orderNum = vars.orderNumber || 'NC-ORDER';
  const reason = vars.reason || 'Requested by customer';
  const subject = `Order Cancellation Notice - #${orderNum}`;

  const body = `
    <span class="badge" style="background: #FEE2E2; color: #DC2626; border-color: #FCA5A5;">Order Cancelled</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Order Cancellation Confirmation</h2>
    <p>Hi ${name}, order <strong style="color: #F15A25;">#${orderNum}</strong> has been cancelled.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>If any payment was already processed, the refund will be credited back to your original payment source within 3-5 business days.</p>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderInvoiceEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Customer';
  const orderNum = vars.orderNumber || 'NC-ORDER';
  const subject = `Tax Invoice - Order #${orderNum}`;

  const body = `
    <span class="badge">Official Tax Invoice</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Tax Invoice for Order #${orderNum}</h2>
    <p>Hi ${name}, please find attached the official GST Tax Invoice for order <strong>#${orderNum}</strong>.</p>
    <p><strong>Total Paid:</strong> <span style="font-size: 16px; font-weight: 800; color: #F15A25;">${formatPrice(vars.amount)}</span></p>

    ${
      vars.invoiceUrl
        ? `
    <div style="text-align: center;">
      <a href="${vars.invoiceUrl}" class="button">Download Tax Invoice PDF →</a>
    </div>
    `
        : ''
    }
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderReturnApprovedEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const name = vars.customerName || 'Customer';
  const orderNum = vars.orderNumber || 'NC-ORDER';
  const subject = `Return Request Approved - #${orderNum}`;

  const body = `
    <span class="badge" style="background: #EFF6FF; color: #2563EB; border-color: #BFDBFE;">Return Approved</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">Return Request Approved</h2>
    <p>Hi ${name}, your return request for order <strong style="color: #F15A25;">#${orderNum}</strong> has been reviewed and approved.</p>
    <p>Our courier partner will arrive within 2-3 business days to pick up the package. Please ensure items are unused with original tags attached.</p>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

export function renderAdminAlertEmail(vars: NotificationTemplateVariables): {
  subject: string;
  html: string;
} {
  const alertTitle = vars.customMessage || 'Admin System Alert';
  const subject = `[ADMIN ALERT] ${alertTitle}`;

  const body = `
    <span class="badge" style="background: #FEE2E2; color: #DC2626; border-color: #FCA5A5;">Critical Admin Alert</span>
    <h2 style="font-size: 22px; color: #183A73; margin-top: 0;">${alertTitle}</h2>
    <div style="background: #F8FAFC; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E2E8F0; font-family: monospace; font-size: 13px;">
      <p style="margin: 0 0 8px 0;"><strong>Event:</strong> ${vars.reason || alertTitle}</p>
      ${vars.orderNumber ? `<p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> ${vars.orderNumber}</p>` : ''}
      ${vars.amount ? `<p style="margin: 0 0 8px 0;"><strong>Amount:</strong> ${formatPrice(vars.amount)}</p>` : ''}
      ${vars.productName ? `<p style="margin: 0 0 8px 0;"><strong>Product:</strong> ${vars.productName} (${vars.productSku || 'SKU'})</p>` : ''}
      ${vars.stockCount !== undefined ? `<p style="margin: 0 0 8px 0;"><strong>Stock Left:</strong> ${vars.stockCount}</p>` : ''}
      ${vars.failureReason ? `<p style="margin: 0;"><strong>Failure Detail:</strong> ${vars.failureReason}</p>` : ''}
    </div>
  `;
  return { subject, html: wrapEmailLayout(subject, body) };
}

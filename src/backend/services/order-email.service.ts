import { OrderStatus } from '@prisma/client';
import axios from 'axios';

import { NOTIFICATION_CONSTANTS } from '@/frontend/features/notifications/constants/notification.constants';
import { prisma } from '@/lib/prisma';

export interface SendEmailPayload {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
}

export class OrderEmailNotificationService {
  /**
   * Dispatches a single transactional email via Brevo API with graceful dev/fallback support.
   */
  private static async sendBrevoEmail(payload: SendEmailPayload): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || '';
    const emailConfig = NOTIFICATION_CONSTANTS.EMAIL_PROVIDER || NOTIFICATION_CONSTANTS.BREVO;
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL ||
      process.env.EMAIL_SENDER ||
      emailConfig.SENDER_EMAIL ||
      'gurvindersingh0218@gmail.com';
    const senderName = emailConfig.SENDER_NAME || 'Navya Collection';

    const cleanEmail = (payload.toEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      console.warn(
        `[ORDER_EMAIL_DISPATCH_WARN] Invalid recipient email address: "${payload.toEmail}"`,
      );
      return false;
    }

    if (!apiKey || apiKey.trim().length === 0) {
      console.log(`📧 [DEV_EMAIL_SIMULATED] To: ${cleanEmail} | Subject: "${payload.subject}"`);
      return true;
    }

    try {
      const response = await axios.post(
        `${emailConfig.API_URL}${emailConfig.EMAIL_ENDPOINT}`,
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: cleanEmail, name: payload.toName || 'Valued Partner' }],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
        },
        {
          headers: {
            accept: 'application/json',
            'api-key': apiKey.trim(),
            'content-type': 'application/json',
          },
          timeout: 12000,
        },
      );

      console.log(
        `✅ [ORDER_EMAIL_SENT] Email sent to ${cleanEmail} (MessageId: ${response.data?.messageId || 'ok'})`,
      );
      return true;
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error.message || 'Brevo API call failed';
      console.warn(`⚠️ [ORDER_EMAIL_ERROR] Failed to send email to ${cleanEmail}:`, errorMsg);

      // If sender was unverified domain, attempt fallback to default verified sender
      if (senderEmail !== 'gurvindersingh0218@gmail.com') {
        try {
          await axios.post(
            `${emailConfig.API_URL}${emailConfig.EMAIL_ENDPOINT}`,
            {
              sender: { name: senderName, email: 'gurvindersingh0218@gmail.com' },
              to: [{ email: cleanEmail, name: payload.toName || 'Valued Partner' }],
              subject: payload.subject,
              htmlContent: payload.htmlContent,
            },
            {
              headers: {
                accept: 'application/json',
                'api-key': apiKey.trim(),
                'content-type': 'application/json',
              },
              timeout: 10000,
            },
          );
          console.log(
            `✅ [ORDER_EMAIL_FALLBACK_SENT] Email sent via fallback sender to ${cleanEmail}`,
          );
          return true;
        } catch (retryErr: any) {
          console.error(
            '⚠️ [ORDER_EMAIL_FALLBACK_FAILED]',
            retryErr?.response?.data || retryErr.message,
          );
        }
      }

      return false;
    }
  }

  /**
   * Formats INR currency
   */
  private static formatCurrency(amount: number | string | any): string {
    const num = Number(amount || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  /**
   * Main entry point when an order is created (Prepaid or COD).
   * Asynchronously triggers emails to:
   * 1. Customer (Order Confirmation & Invoice Summary)
   * 2. Seller(s) (New Order Alert with shop items & payout details)
   * 3. Admin / Store Owner (Master Order Alert)
   */
  static async notifyOrderCreated(orderId: string): Promise<void> {
    try {
      if (!orderId) return;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: { id: true, name: true, email: true, mobile: true },
          },
          address: true,
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isPrimary: true }, take: 1 },
                  shop: {
                    include: {
                      owner: { select: { id: true, name: true, email: true, mobile: true } },
                    },
                  },
                },
              },
              variant: true,
              shop: {
                include: {
                  owner: { select: { id: true, name: true, email: true, mobile: true } },
                },
              },
            },
          },
          vendorOrders: {
            include: {
              shop: {
                include: {
                  owner: { select: { id: true, name: true, email: true, mobile: true } },
                },
              },
            },
          },
        },
      });

      if (!order) {
        console.warn(`[ORDER_EMAIL_TRIGGER] Order not found for notification: ${orderId}`);
        return;
      }

      const customerName = order.user?.name || order.address?.fullName || 'Valued Customer';
      const customerEmail = (order.user?.email || '').trim().toLowerCase();
      const customerMobile = order.address?.mobile || order.user?.mobile || 'N/A';
      const orderNumber = order.orderNumber;
      const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const paymentMethodLabel =
        order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Online Paid (Razorpay/UPI)';
      const deliveryAddress = order.address
        ? `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`
        : 'Address on file';

      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store';
      const adminBaseUrl =
        process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.navyacollection.store';
      const sellerBaseUrl = process.env.NEXT_PUBLIC_SELLER_URL || `${appBaseUrl}/seller`;

      // =========================================================================
      // 1. DISPATCH CUSTOMER ORDER CONFIRMATION EMAIL
      // =========================================================================
      if (customerEmail) {
        const itemRows = order.items
          .map((item) => {
            const img =
              item.product?.images?.[0]?.imageUrl ||
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=160';
            const variantText = [
              item.variant?.size ? `Size: ${item.variant.size}` : '',
              item.variant?.color ? `Color: ${item.variant.color}` : '',
            ]
              .filter(Boolean)
              .join(' | ');

            return `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 14px 8px; width: 64px; vertical-align: top;">
                  <img src="${img}" alt="${item.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" />
                </td>
                <td style="padding: 14px 8px; vertical-align: top;">
                  <div style="font-weight: 700; color: #183A73; font-size: 14px;">${item.name}</div>
                  ${variantText ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${variantText}</div>` : ''}
                  <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Qty: ${item.quantity} × ${this.formatCurrency(item.price)}</div>
                </td>
                <td style="padding: 14px 8px; vertical-align: top; text-align: right; font-weight: 700; color: #183A73; font-size: 14px;">
                  ${this.formatCurrency(item.total)}
                </td>
              </tr>
            `;
          })
          .join('');

        const customerHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmation #${orderNumber}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #183A73 0%, #0F2145 100%); padding: 32px 24px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: 2px;">NAVYA COLLECTION</h1>
                <p style="color: #F15A25; font-size: 11px; font-weight: 800; letter-spacing: 4px; margin-top: 6px; text-transform: uppercase;">Style That Speaks</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 32px 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #a7f3d0;">
                    ✓ Order Confirmed
                  </span>
                  <h2 style="color: #183A73; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0;">Thank you for your order, ${customerName}!</h2>
                  <p style="color: #64748b; font-size: 14px; margin: 0;">We've received your order <strong>#${orderNumber}</strong> on ${orderDate} and our boutiques are getting it ready.</p>
                </div>

                <!-- Items Table -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                  <h3 style="color: #183A73; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Order Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${itemRows}
                  </table>

                  <!-- Totals Breakdown -->
                  <div style="margin-top: 16px; border-top: 2px dashed #e2e8f0; padding-top: 12px; font-size: 13px; color: #475569;">
                    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                      <span>Subtotal</span>
                      <span style="font-weight: 600; color: #1e293b;">${this.formatCurrency(order.totalAmount)}</span>
                    </div>
                    ${
                      Number(order.discountAmount || 0) > 0
                        ? `
                    <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #059669;">
                      <span>Coupon Discount</span>
                      <span style="font-weight: 600;">-${this.formatCurrency(order.discountAmount)}</span>
                    </div>`
                        : ''
                    }
                    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                      <span>Shipping Fee</span>
                      <span style="font-weight: 600; color: #1e293b;">${Number(order.shippingAmount) === 0 ? 'FREE' : this.formatCurrency(order.shippingAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0 0 0; margin-top: 8px; border-top: 1px solid #f1f5f9; font-size: 16px; font-weight: 800; color: #183A73;">
                      <span>Grand Total</span>
                      <span style="color: #F15A25;">${this.formatCurrency(order.finalAmount)}</span>
                    </div>
                  </div>
                </div>

                <!-- Shipping & Payment Info -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 28px; font-size: 13px;">
                  <div style="margin-bottom: 12px;">
                    <strong style="color: #183A73; display: block; margin-bottom: 4px;">📍 Delivery Address:</strong>
                    <span style="color: #475569; line-height: 1.5;">${deliveryAddress}</span>
                  </div>
                  <div>
                    <strong style="color: #183A73; display: block; margin-bottom: 4px;">💳 Payment Mode:</strong>
                    <span style="color: #475569;">${paymentMethodLabel} (${order.paymentStatus})</span>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0 16px 0;">
                  <a href="${appBaseUrl}/account/orders" style="background-color: #F15A25; color: #ffffff; text-decoration: none; padding: 15px 36px; font-size: 14px; font-weight: 800; border-radius: 50px; display: inline-block; box-shadow: 0 4px 14px rgba(241, 90, 37, 0.35);">
                    Track Your Order Status →
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; color: #64748b;">Need help with this order? Contact our concierge team at <a href="mailto:support@navyacollection.store" style="color: #183A73; text-decoration: none; font-weight: 600;">support@navyacollection.store</a></p>
                <p style="margin: 0;">© ${new Date().getFullYear()} Navya Collection Marketplace. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        this.sendBrevoEmail({
          toEmail: customerEmail,
          toName: customerName,
          subject: `🎉 Order Confirmed! #${orderNumber} - Navya Collection`,
          htmlContent: customerHtml,
        }).catch((err) => console.error('[CUSTOMER_ORDER_EMAIL_ERR]', err));
      }

      // =========================================================================
      // 2. DISPATCH SELLER EMAILS (Grouped by Boutique / Vendor)
      // =========================================================================
      const shopItemsGroup = new Map<
        string,
        {
          shopName: string;
          shopEmail: string;
          sellerName: string;
          vendorOrderNumber?: string;
          vendorPayout?: number;
          items: typeof order.items;
        }
      >();

      for (const item of order.items) {
        const targetShop = item.shop || item.product?.shop;
        const shopId = targetShop?.id || item.shopId || 'DEFAULT_SHOP';
        const shopName = targetShop?.name || 'Navya Boutique';
        const shopEmail = targetShop?.email || targetShop?.owner?.email || '';
        const sellerName = targetShop?.owner?.name || targetShop?.name || 'Boutique Partner';

        const vo = order.vendorOrders.find((v) => v.shopId === shopId);

        if (!shopItemsGroup.has(shopId)) {
          shopItemsGroup.set(shopId, {
            shopName,
            shopEmail,
            sellerName,
            vendorOrderNumber: vo?.vendorOrderNumber || `${orderNumber}-V1`,
            vendorPayout: vo ? Number(vo.vendorPayoutAmount) : undefined,
            items: [],
          });
        }
        shopItemsGroup.get(shopId)!.items.push(item);
      }

      for (const [shopId, sData] of Array.from(shopItemsGroup.entries())) {
        if (!sData.shopEmail) {
          console.warn(
            `[SELLER_EMAIL_SKIP] No email found for shop "${sData.shopName}" (${shopId})`,
          );
          continue;
        }

        const shopSubtotal = sData.items.reduce((sum, itm) => sum + Number(itm.total), 0);
        const estimatedPayout =
          sData.vendorPayout !== undefined ? sData.vendorPayout : shopSubtotal * 0.9;
        const marketplaceFee = shopSubtotal - estimatedPayout;

        const sellerItemRows = sData.items
          .map((item) => {
            const img =
              item.product?.images?.[0]?.imageUrl ||
              'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=160';
            const variantText = [
              item.variant?.size ? `Size: <strong>${item.variant.size}</strong>` : '',
              item.variant?.color ? `Color: <strong>${item.variant.color}</strong>` : '',
              `SKU: <code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px;">${item.sku}</code>`,
            ]
              .filter(Boolean)
              .join(' | ');

            return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 8px; width: 60px; vertical-align: top;">
                  <img src="${img}" alt="${item.name}" style="width: 52px; height: 52px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1;" />
                </td>
                <td style="padding: 12px 8px; vertical-align: top;">
                  <div style="font-weight: 700; color: #0f172a; font-size: 14px;">${item.name}</div>
                  <div style="font-size: 12px; color: #475569; margin-top: 3px;">${variantText}</div>
                  <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Quantity: <strong>${item.quantity} unit(s)</strong> × ${this.formatCurrency(item.price)}</div>
                </td>
                <td style="padding: 12px 8px; vertical-align: top; text-align: right; font-weight: 700; color: #0f172a; font-size: 14px;">
                  ${this.formatCurrency(item.total)}
                </td>
              </tr>
            `;
          })
          .join('');

        const sellerHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Order Alert - ${sData.shopName}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <div style="background-color: #0f172a; padding: 28px 24px; text-align: center; border-bottom: 4px solid #F15A25;">
                <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 1px;">NAVYA SELLER HUB</h1>
                <p style="color: #f59e0b; font-size: 12px; font-weight: 700; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px;">New Order Notification</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 32px 24px;">
                <div style="margin-bottom: 24px;">
                  <span style="background-color: #fef3c7; color: #b45309; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #fde68a;">
                    Action Required: Pack Order
                  </span>
                  <h2 style="color: #0f172a; font-size: 20px; font-weight: 800; margin: 14px 0 6px 0;">Hello ${sData.sellerName},</h2>
                  <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.5;">
                    Great news! A customer just placed an order for items from your boutique <strong>${sData.shopName}</strong>.
                  </p>
                </div>

                <!-- Order Reference Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #64748b;">Master Order #:</span>
                    <strong style="color: #0f172a; font-family: monospace;">${orderNumber}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #64748b;">Vendor Sub-Order #:</span>
                    <strong style="color: #b45309; font-family: monospace;">${sData.vendorOrderNumber}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #64748b;">Order Date:</span>
                    <span style="color: #0f172a; font-weight: 600;">${orderDate}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #64748b;">Payment Method:</span>
                    <strong style="color: #183A73;">${paymentMethodLabel}</strong>
                  </div>
                </div>

                <!-- Ordered Items -->
                <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                  <h3 style="color: #0f172a; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">Items to Pack</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    ${sellerItemRows}
                  </table>

                  <!-- Payout Calculation -->
                  <div style="margin-top: 16px; border-top: 2px dashed #e2e8f0; padding-top: 12px; font-size: 13px; color: #475569;">
                    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
                      <span>Shop Items Subtotal</span>
                      <span style="font-weight: 600; color: #1e293b;">${this.formatCurrency(shopSubtotal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
                      <span>Marketplace Commission (10%)</span>
                      <span>-${this.formatCurrency(marketplaceFee)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 10px 0 0 0; margin-top: 8px; border-top: 1px solid #f1f5f9; font-size: 15px; font-weight: 800; color: #059669;">
                      <span>Estimated Seller Payout</span>
                      <span>${this.formatCurrency(estimatedPayout)}</span>
                    </div>
                  </div>
                </div>

                <!-- Shipping Destination Summary -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 28px; font-size: 13px;">
                  <strong style="color: #0f172a; display: block; margin-bottom: 4px;">📦 Ship To Destination:</strong>
                  <span style="color: #475569;">${order.address?.city || 'Customer City'}, ${order.address?.state || ''} - Pincode: <strong>${order.address?.pincode || ''}</strong></span>
                </div>

                <!-- Seller CTA -->
                <div style="text-align: center; margin: 28px 0 12px 0;">
                  <a href="${sellerBaseUrl}/orders" style="background-color: #183A73; color: #ffffff; text-decoration: none; padding: 15px 36px; font-size: 14px; font-weight: 800; border-radius: 50px; display: inline-block; box-shadow: 0 4px 14px rgba(241, 90, 37, 0.3);">
                    Open Seller Dashboard to Fulfill →
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 4px 0; color: #64748b;">Please pack and dispatch within 24-48 hours to maintain your Fast Dispatch seller badge.</p>
                <p style="margin: 0;">© ${new Date().getFullYear()} Navya Collection Multi-Vendor Merchant Portal</p>
              </div>
            </div>
          </body>
          </html>
        `;

        this.sendBrevoEmail({
          toEmail: sData.shopEmail,
          toName: sData.sellerName,
          subject: `🛍️ New Order Received! Order #${orderNumber} - ${sData.shopName}`,
          htmlContent: sellerHtml,
        }).catch((err) => console.error('[SELLER_ORDER_EMAIL_ERR]', err));
      }

      // =========================================================================
      // 3. DISPATCH STORE ADMIN / OWNER ORDER ALERT EMAIL
      // =========================================================================
      const adminEmail =
        process.env.ADMIN_ALERT_EMAIL ||
        process.env.ADMIN_EMAIL ||
        NOTIFICATION_CONSTANTS.ADMIN.EMAIL ||
        'gurvindersingh0218@gmail.com';

      const adminItemRows = order.items
        .map((item) => {
          const shopName = item.shop?.name || item.product?.shop?.name || 'Navya Collection';
          return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 6px; font-size: 13px; color: #0f172a;">
                <strong>${item.name}</strong>
                <div style="font-size: 11px; color: #64748b;">Shop: <span style="color: #b45309; font-weight: 600;">${shopName}</span> | Qty: ${item.quantity} | SKU: ${item.sku}</div>
              </td>
              <td style="padding: 10px 6px; font-size: 13px; text-align: right; font-weight: 700; color: #0f172a;">
                ${this.formatCurrency(item.total)}
              </td>
            </tr>
          `;
        })
        .join('');

      const adminHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Order Alert #${orderNumber}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
            
            <div style="background-color: #0f172a; padding: 24px; text-align: center;">
              <h2 style="color: #f59e0b; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 1px;">NAVYA ADMIN GOVERNANCE</h2>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">New Marketplace Transaction Placed</p>
            </div>

            <div style="padding: 28px 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                <div>
                  <h3 style="margin: 0; color: #0f172a; font-size: 18px;">Order #${orderNumber}</h3>
                  <span style="font-size: 12px; color: #64748b;">${orderDate}</span>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 18px; font-weight: 800; color: #F15A25;">${this.formatCurrency(order.finalAmount)}</span>
                  <div style="font-size: 11px; font-weight: 700; color: #059669;">${paymentMethodLabel}</div>
                </div>
              </div>

              <!-- Customer Info -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px;">
                <strong style="color: #0f172a; display: block; margin-bottom: 6px;">👤 Customer Details:</strong>
                <div style="color: #334155; margin-bottom: 3px;"><strong>Name:</strong> ${customerName}</div>
                <div style="color: #334155; margin-bottom: 3px;"><strong>Mobile:</strong> ${customerMobile}</div>
                <div style="color: #334155; margin-bottom: 3px;"><strong>Email:</strong> ${customerEmail || 'N/A'}</div>
                <div style="color: #334155;"><strong>Address:</strong> ${deliveryAddress}</div>
              </div>

              <!-- Items Breakdown -->
              <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                <h4 style="color: #0f172a; font-size: 13px; font-weight: 800; text-transform: uppercase; margin: 0 0 10px 0;">Multi-Vendor Items</h4>
                <table style="width: 100%; border-collapse: collapse;">
                  ${adminItemRows}
                </table>
              </div>

              <div style="text-align: center; margin: 24px 0 12px 0;">
                <a href="${adminBaseUrl}/orders" style="background-color: #b45309; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 800; border-radius: 50px; display: inline-block;">
                  Open Admin Order Console →
                </a>
              </div>
            </div>

            <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              © ${new Date().getFullYear()} Navya Collection Marketplace Engine
            </div>
          </div>
        </body>
        </html>
      `;

      this.sendBrevoEmail({
        toEmail: adminEmail,
        toName: 'Store Administrator',
        subject: `🛒 [New Marketplace Order] #${orderNumber} - ${this.formatCurrency(order.finalAmount)} (${customerName})`,
        htmlContent: adminHtml,
      }).catch((err) => console.error('[ADMIN_ORDER_EMAIL_ERR]', err));
    } catch (error: any) {
      console.error('[ORDER_EMAIL_NOTIFICATION_SERVICE_ERROR]', error?.message || error);
    }
  }

  /**
   * Dispatches lifecycle status update emails to Customer (and Seller if cancelled).
   * Supports: CONFIRMED, PROCESSING, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
   */
  static async notifyOrderStatusChanged(
    orderId: string,
    newStatus: string | OrderStatus,
    options?: {
      trackingNumber?: string | null;
      courierName?: string | null;
      trackingUrl?: string | null;
      reason?: string | null;
    },
  ): Promise<void> {
    try {
      if (!orderId) return;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: { select: { id: true, name: true, email: true, mobile: true } },
          address: true,
          items: {
            include: {
              product: { select: { name: true } },
              shop: {
                include: { owner: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
      });

      if (!order) return;

      const customerName = order.user?.name || order.address?.fullName || 'Customer';
      const customerEmail = (order.user?.email || '').trim().toLowerCase();
      const orderNumber = order.orderNumber;
      const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store';

      const statusNormalized = String(newStatus).toUpperCase();
      const trackingAwb =
        options?.trackingNumber || order.awbCode || order.trackingNumber || 'AWB-PENDING';
      const courier = options?.courierName || order.courierName || 'Shiprocket Partner';
      const liveTrackingUrl =
        options?.trackingUrl ||
        order.trackingUrl ||
        (trackingAwb !== 'AWB-PENDING'
          ? `https://navyacollection.store/tracking?awb=${trackingAwb}`
          : `${appBaseUrl}/account/orders`);

      let emailSubject = '';
      let badgeLabel = '';
      let badgeColor = '#183A73';
      let titleMessage = '';
      let bodyText = '';
      let ctaLabel = 'View Order History →';
      let ctaLink = `${appBaseUrl}/account/orders`;

      switch (statusNormalized) {
        case 'CONFIRMED':
        case 'PROCESSING':
          emailSubject = `✅ Order Confirmed & Being Prepared - #${orderNumber}`;
          badgeLabel = 'Order Accepted';
          badgeColor = '#059669';
          titleMessage = 'Your order is being carefully packed!';
          bodyText = `Hi ${customerName}, your order <strong>#${orderNumber}</strong> has been accepted by our boutiques and is currently being inspected, packed, and prepared for dispatch.`;
          break;

        case 'SHIPPED':
        case 'IN_TRANSIT':
          emailSubject = `🚚 Your Order Has Been Dispatched! #${orderNumber}`;
          badgeLabel = 'Dispatched & On The Way';
          badgeColor = '#2563eb';
          titleMessage = 'Your package is on its way!';
          bodyText = `
            Hi ${customerName}, exciting news! Your order <strong>#${orderNumber}</strong> has been handed over to <strong>${courier}</strong>.
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px;">
              <div style="margin-bottom: 6px;"><strong>Courier Partner:</strong> ${courier}</div>
              <div><strong>Tracking / AWB Number:</strong> <code style="color: #F15A25; font-size: 14px; font-weight: 800; font-family: monospace;">${trackingAwb}</code></div>
            </div>
          `;
          ctaLabel = 'Live Shipment Tracking →';
          ctaLink = liveTrackingUrl;
          break;

        case 'OUT_FOR_DELIVERY':
          emailSubject = `📦 Out for Delivery Today! #${orderNumber}`;
          badgeLabel = 'Out For Delivery';
          badgeColor = '#d97706';
          titleMessage = 'Your package will arrive today!';
          bodyText = `
            Hi ${customerName}, your package for order <strong>#${orderNumber}</strong> is out for delivery with the courier agent today. Please keep your phone reachable.
            ${order.paymentMethod === 'COD' ? `<p style="color: #b45309; font-weight: bold;">Note: This is a Cash on Delivery order of ${this.formatCurrency(order.finalAmount)}. Please keep cash ready.</p>` : ''}
          `;
          ctaLabel = 'Track Courier Location →';
          ctaLink = liveTrackingUrl;
          break;

        case 'DELIVERED':
          emailSubject = `🎉 Package Delivered! Thank you for shopping with Navya Collection - #${orderNumber}`;
          badgeLabel = 'Successfully Delivered';
          badgeColor = '#16a34a';
          titleMessage = 'Your package has been delivered!';
          bodyText = `
            Hi ${customerName}, your order <strong>#${orderNumber}</strong> was marked delivered today. We hope you love your new pieces!
            <p>If you have a moment, please share your thoughts and rate the items to help our boutique artisans.</p>
          `;
          ctaLabel = 'Write a Product Review →';
          ctaLink = `${appBaseUrl}/account/orders`;
          break;

        case 'CANCELLED':
          emailSubject = `⚠️ Order Cancellation Notice - #${orderNumber}`;
          badgeLabel = 'Order Cancelled';
          badgeColor = '#dc2626';
          titleMessage = 'Order Cancellation Update';
          bodyText = `
            Hi ${customerName}, order <strong>#${orderNumber}</strong> has been cancelled.
            ${options?.reason ? `<p><strong>Reason:</strong> ${options.reason}</p>` : ''}
            <p>If you paid online via Razorpay or UPI, the full refund will be automatically credited back to your original source account within 3-5 business days.</p>
          `;
          ctaLabel = 'Explore Collection →';
          ctaLink = `${appBaseUrl}/shop`;
          break;

        default:
          return;
      }

      if (customerEmail) {
        const customerStatusHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${emailSubject}</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #183A73 0%, #0F2145 100%); padding: 30px 24px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: 2px;">NAVYA COLLECTION</h1>
                <p style="color: #F15A25; font-size: 11px; font-weight: 800; letter-spacing: 3px; margin-top: 4px; text-transform: uppercase;">Style That Speaks</p>
              </div>

              <!-- Main Content -->
              <div style="padding: 32px 24px;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="background-color: #f1f5f9; color: ${badgeColor}; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #e2e8f0;">
                    ${badgeLabel}
                  </span>
                  <h2 style="color: #183A73; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0;">${titleMessage}</h2>
                </div>

                <div style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                  ${bodyText}
                </div>

                <!-- CTA -->
                <div style="text-align: center; margin: 32px 0 16px 0;">
                  <a href="${ctaLink}" style="background-color: #183A73; color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 14px; font-weight: 800; border-radius: 50px; display: inline-block; box-shadow: 0 4px 14px rgba(241, 90, 37, 0.25);">
                    ${ctaLabel}
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 6px 0; color: #64748b;">Have a question? We're here to help: <a href="mailto:support@navyacollection.store" style="color: #183A73; text-decoration: none; font-weight: 600;">support@navyacollection.store</a></p>
                <p style="margin: 0;">© ${new Date().getFullYear()} Navya Collection. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        this.sendBrevoEmail({
          toEmail: customerEmail,
          toName: customerName,
          subject: emailSubject,
          htmlContent: customerStatusHtml,
        }).catch((err) => console.error('[CUSTOMER_STATUS_EMAIL_ERR]', err));
      }

      // If cancelled, also alert the shop sellers
      if (statusNormalized === 'CANCELLED') {
        const uniqueSellers = new Map<string, { email: string; name: string }>();
        for (const item of order.items) {
          const s = item.shop;
          const email = s?.email || s?.owner?.email;
          if (email && !uniqueSellers.has(email)) {
            uniqueSellers.set(email, { email, name: s?.name || 'Seller' });
          }
        }

        for (const [sellerEmail, sellerInfo] of Array.from(uniqueSellers.entries())) {
          this.sendBrevoEmail({
            toEmail: sellerEmail,
            toName: sellerInfo.name,
            subject: `⚠️ Order #${orderNumber} has been Cancelled`,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 500px; margin: 0 auto;">
                <h3 style="color: #dc2626; margin-top: 0;">Order Cancelled: #${orderNumber}</h3>
                <p>Hello ${sellerInfo.name}, order <strong>#${orderNumber}</strong> has been cancelled. Please do not dispatch items for this order. Inventory items have been restored to your catalog stock.</p>
              </div>
            `,
          }).catch((err) => console.error('[SELLER_CANCEL_EMAIL_ERR]', err));
        }
      }
    } catch (err: any) {
      console.error('[NOTIFY_ORDER_STATUS_CHANGED_ERR]', err?.message || err);
    }
  }
}

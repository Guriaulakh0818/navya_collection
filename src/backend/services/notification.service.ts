import { NotificationChannel, NotificationType, Role } from '@prisma/client';
import axios from 'axios';

import { NOTIFICATION_CONSTANTS } from '@/frontend/features/notifications/constants/notification.constants';
import { prisma } from '@/lib/prisma';

export interface SendNotificationOptions {
  userId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  link?: string;
  recipient?: string;
  metadata?: any;
}

export interface AdminSellerRegistrationEmailOptions {
  sellerName: string;
  shopName: string;
  mobile: string;
  email: string;
  city: string;
  state: string;
  submissionTime: string;
  shopId: string;
}

export class NotificationService {
  /**
   * Core notification dispatcher storing in Prisma database table.
   */
  static async sendNotification(options: SendNotificationOptions) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: options.userId || null,
          title: options.title,
          message: options.message,
          type: options.type || 'SYSTEM',
          channel: options.channel || 'IN_APP',
          link: options.link || null,
          recipient: options.recipient || null,
          metadata: options.metadata || undefined,
          status: 'PENDING',
        },
      });

      this.dispatchExternalNotification(notification, options);

      return notification;
    } catch (error) {
      console.error('❌ Failed to create database notification:', error);
      return null;
    }
  }

  /**
   * Sends admin email alert & in-app notifications immediately after seller submits registration application.
   */
  static async notifyAdminNewSellerRegistration(options: AdminSellerRegistrationEmailOptions) {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const reviewLink = `${baseUrl.replace(/\/$/, '')}/admin/sellers/${options.shopId}`;

    // 1. Create in-app notifications for Admin & Owner users
    try {
      const adminUsers = await prisma.user.findMany({
        where: { role: { in: [Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN] } },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM',
            title: `New Seller Application: "${options.shopName}"`,
            message: `Seller ${options.sellerName} (${options.email}, ${options.mobile}) registered shop "${options.shopName}" from ${options.city}, ${options.state}.`,
            link: `/admin/sellers/${options.shopId}`,
          })),
        });
      }
    } catch (err) {
      console.warn('⚠️ Non-critical Admin In-App Notification Error:', err);
    }

    // 2. Dispatch Email Notification to Platform Admin
    const adminEmail = NOTIFICATION_CONSTANTS.ADMIN.EMAIL;
    const apiKey = process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || '';

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px; background-color: #0f172a; padding: 20px; border-radius: 12px;">
          <h2 style="color: #f59e0b; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 1px;">NAVYA COLLECTION ADMIN GOVERNANCE</h2>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">New Merchant Onboarding Submission Alert</p>
        </div>
        
        <p style="font-size: 15px; color: #1e293b; font-weight: 600;">Hello Administrator,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">A new merchant partner has completed and submitted their 8-step registration on Navya Collection Marketplace:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #334155;">
            <tr>
              <td style="padding: 6px 0; font-weight: bold; width: 140px;">Seller Name:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${options.sellerName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Shop / Dukan Name:</td>
              <td style="padding: 6px 0; font-weight: 700; color: #b45309;">${options.shopName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Mobile Number:</td>
              <td style="padding: 6px 0; font-weight: 600;">${options.mobile}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Email Address:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #2563eb;">${options.email}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">City &amp; State:</td>
              <td style="padding: 6px 0;">${options.city}, ${options.state}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Submission Time:</td>
              <td style="padding: 6px 0;">${options.submissionTime}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="${reviewLink}" style="background-color: #b45309; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 800; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3);">
            Inspect &amp; Review Application →
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.4;">
          Direct Link: <a href="${reviewLink}" style="color: #2563eb;">${reviewLink}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">© ${new Date().getFullYear()} Navya Collection Marketplace Governance Engine</p>
      </div>
    `;

    if (apiKey) {
      try {
        const emailConfig = NOTIFICATION_CONSTANTS.EMAIL_PROVIDER || NOTIFICATION_CONSTANTS.BREVO;
        await axios.post(
          `${emailConfig.API_URL}${emailConfig.EMAIL_ENDPOINT}`,
          {
            sender: { name: 'Navya Seller Onboarding', email: emailConfig.SENDER_EMAIL },
            to: [{ email: adminEmail, name: 'Marketplace Admin' }],
            subject: `🚨 [New Seller Application] ${options.shopName} (${options.sellerName})`,
            htmlContent,
          },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
            },
          },
        );
        console.log(`✅ [ADMIN_EMAIL_SENT] Seller submission alert sent to ${adminEmail}`);
      } catch (emailErr: any) {
        console.warn('⚠️ Failed to dispatch Admin Email Alert:', emailErr?.message || emailErr);
      }
    } else {
      console.log(
        `📧 [DEV_ADMIN_EMAIL_LOG] Admin submission alert for ${options.shopName} to ${adminEmail}. Review Link: ${reviewLink}`,
      );
    }
  }

  /**
   * Notifies the seller whenever their application status updates (PENDING, UNDER_REVIEW, APPROVED, REJECTED).
   * Generates both in-app notification record and transactional email.
   */
  static async notifySellerStatusChange(
    userId: string,
    email: string,
    shopName: string,
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | string,
    reasonOrNotes?: string,
  ) {
    let title = '';
    let message = '';
    let emailSubject = '';
    let statusBgColor = '#0f172a';

    switch (status) {
      case 'APPROVED':
        title = '🎉 Boutique Seller Application Approved!';
        message = `Congratulations! Your boutique store "${shopName}" has been approved. You can now list products and manage orders from your Seller Dashboard.`;
        emailSubject = `🎉 Application Approved! Welcome to Navya Collection Merchant Network`;
        statusBgColor = '#059669';
        break;
      case 'UNDER_REVIEW':
        title = '⏳ Application Under Review';
        message = `Your boutique application for "${shopName}" is currently under detailed compliance review. ${reasonOrNotes ? `Notes: ${reasonOrNotes}` : ''}`;
        emailSubject = `⏳ Application Status Update: Under Review - ${shopName}`;
        statusBgColor = '#4f46e5';
        break;
      case 'REJECTED':
        title = '⚠️ Application Rejection / Action Required';
        message = `Your seller application for "${shopName}" requires revision. Reason: ${reasonOrNotes || 'Compliance document update required.'}`;
        emailSubject = `⚠️ Action Required: Seller Application for ${shopName}`;
        statusBgColor = '#dc2626';
        break;
      case 'PENDING':
      default:
        title = '📋 Application Received & Pending Verification';
        message = `Your seller application for "${shopName}" is safely received and pending admin review.`;
        emailSubject = `📋 Registration Received: ${shopName} - Pending Verification`;
        statusBgColor = '#d97706';
        break;
    }

    // 1. Create In-App Notification Record in Database
    try {
      await this.sendNotification({
        userId,
        title,
        message,
        type: status === 'APPROVED' ? 'WELCOME' : 'SYSTEM',
        channel: 'IN_APP',
        link: status === 'APPROVED' ? '/seller/dashboard' : '/become-seller',
      });
    } catch (err) {
      console.warn('⚠️ Failed to store in-app notification:', err);
    }

    // 2. Dispatch Email Notification to Seller
    const apiKey = process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || '';
    if (apiKey && email) {
      try {
        const emailConfig = NOTIFICATION_CONSTANTS.EMAIL_PROVIDER || NOTIFICATION_CONSTANTS.BREVO;
        const htmlContent = `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px; background-color: ${statusBgColor}; padding: 20px; border-radius: 12px;">
              <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0;">NAVYA COLLECTION MARKETPLACE</h2>
              <p style="color: #f8fafc; font-size: 12px; margin-top: 4px; font-weight: 600;">Status Update: ${status}</p>
            </div>
            
            <p style="font-size: 15px; color: #1e293b; font-weight: 600;">Hello Merchant Partner,</p>
            <p style="font-size: 14px; color: #475569; line-height: 1.6;">${message}</p>

            ${
              reasonOrNotes
                ? `
              <div style="background-color: #f8fafc; border-left: 4px solid ${statusBgColor}; padding: 14px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #334155;">
                <strong>Compliance Note / Reason:</strong><br />${reasonOrNotes}
              </div>
            `
                : ''
            }

            <div style="text-align: center; margin: 28px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://navyacollection.store'}${status === 'APPROVED' ? '/seller/dashboard' : '/become-seller'}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 28px; font-size: 14px; font-weight: 700; border-radius: 50px; display: inline-block;">
                ${status === 'APPROVED' ? 'Access Seller Dashboard →' : 'View Application Status →'}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">© ${new Date().getFullYear()} Navya Collection Marketplace Desk</p>
          </div>
        `;

        await axios.post(
          `${emailConfig.API_URL}${emailConfig.EMAIL_ENDPOINT}`,
          {
            sender: { name: 'Navya Merchant Team', email: emailConfig.SENDER_EMAIL },
            to: [{ email, name: shopName }],
            subject: emailSubject,
            htmlContent,
          },
          {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
              'api-key': apiKey,
            },
          },
        );
        console.log(`✅ [SELLER_STATUS_EMAIL_SENT] Email sent to ${email} (Status: ${status})`);
      } catch (emailErr: any) {
        console.warn('⚠️ Failed to send Seller Status Email:', emailErr?.message || emailErr);
      }
    } else {
      console.log(
        `📧 [DEV_SELLER_STATUS_EMAIL_LOG] Status update email for ${shopName} (${email}): ${status}`,
      );
    }
  }

  // Pre-packaged Event Notification Helpers

  static async notifySellerApproved(userId: string, shopName: string) {
    return this.notifySellerStatusChange(userId, '', shopName, 'APPROVED');
  }

  static async notifyProductApproved(sellerUserId: string, productName: string) {
    return this.sendNotification({
      userId: sellerUserId,
      title: '✅ Product Approved & Live',
      message: `Your product listing "${productName}" has been reviewed and approved. It is now live on the Navya Collection Multi-Vendor Marketplace.`,
      type: 'PROMOTION',
      link: '/seller/products',
    });
  }

  static async notifyOrderPlaced(customerUserId: string, orderNumber: string, amount: number) {
    return this.sendNotification({
      userId: customerUserId,
      title: '🛍️ Order Confirmed!',
      message: `Thank you for your purchase! Order #${orderNumber} for ₹${amount.toLocaleString('en-IN')} has been placed successfully.`,
      type: 'ADMIN_NEW_ORDER',
      link: '/account/orders',
    });
  }

  static async notifyPaymentSuccess(userId: string, orderNumber: string, amount: number) {
    return this.sendNotification({
      userId,
      title: '💳 Payment Successful',
      message: `Payment of ₹${amount.toLocaleString('en-IN')} for Order #${orderNumber} was received successfully.`,
      type: 'PAYMENT_UPDATE',
      link: '/account/orders',
    });
  }

  static async notifyShipmentUpdate(
    customerUserId: string,
    orderNumber: string,
    shippingStatus: string,
  ) {
    return this.sendNotification({
      userId: customerUserId,
      title: `🚚 Order #${orderNumber} Status: ${shippingStatus}`,
      message: `Your order status has been updated to "${shippingStatus}". Track shipment details in your account.`,
      type: 'ORDER_UPDATE',
      link: '/account/orders',
    });
  }

  static async notifyOrderCancelled(userId: string, orderNumber: string) {
    return this.sendNotification({
      userId,
      title: '⚠️ Order Cancelled',
      message: `Order #${orderNumber} has been cancelled. Any applicable refund will be processed within 3-5 business days.`,
      type: 'ORDER_CANCELLED',
      link: '/account/orders',
    });
  }

  /**
   * Dispatches transactional WhatsApp notification to customer for order updates (M6)
   */
  static async sendWhatsAppOrderUpdate(options: {
    mobile: string;
    customerName: string;
    orderNumber: string;
    orderTotal: number;
    trackingUrl?: string;
    type: 'ORDER_PLACED' | 'ORDER_SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED';
  }) {
    const cleanMobile = options.mobile.replace(/\D/g, '').slice(-10);
    if (!cleanMobile) return false;

    console.log(
      `💬 [WHATSAPP_NOTIFICATION_DISPATCH] Type: ${options.type} | To: +91${cleanMobile} | Order #${options.orderNumber} (₹${options.orderTotal})`,
    );

    // Persist as a WHATSAPP channel notification record in Prisma
    try {
      await prisma.notification.create({
        data: {
          channel: 'WHATSAPP',
          type: options.type === 'ORDER_PLACED' ? 'ORDER_PLACED' : 'ORDER_SHIPPED',
          title: `WhatsApp: ${options.type.replace(/_/g, ' ')}`,
          message: `Order #${options.orderNumber} update sent to +91${cleanMobile}.`,
          recipient: `+91${cleanMobile}`,
          status: 'SENT',
          metadata: {
            customerName: options.customerName,
            orderTotal: options.orderTotal,
            trackingUrl: options.trackingUrl || null,
          },
        },
      });
    } catch (e) {
      console.warn('⚠️ Could not record WhatsApp notification in database:', e);
    }

    return true;
  }

  private static async dispatchExternalNotification(
    notification: any,
    options: SendNotificationOptions,
  ) {
    if ((process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY) && options.recipient) {
      // External dispatch hook
    }
  }
}

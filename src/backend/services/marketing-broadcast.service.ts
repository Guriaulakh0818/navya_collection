import axios from 'axios';

import {
  ProductShowcaseItem,
  renderFounding50OfferEmail,
  renderProductShowcaseEmail,
  renderReferAndEarnEmail,
} from '@/backend/templates/marketing-templates';
import { prisma } from '@/lib/prisma';

import { PushNotificationService } from './push-notification.service';

export interface BroadcastResult {
  success: boolean;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  message: string;
  testEmailSentTo?: string;
  errors?: string[];
}

export class MarketingBroadcastService {
  private static readonly BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
  private static readonly DEFAULT_SENDER_NAME = 'JiivaaKart';
  private static readonly DEFAULT_ADMIN_EMAIL = 'gurvindersingh0218@gmail.com';

  /**
   * Core dispatcher that transmits HTML email via Brevo SMTP API.
   */
  private static async dispatchEmail(to: string, subject: string, htmlContent: string) {
    const apiKey = process.env.BREVO_API_KEY || process.env.EMAIL_API_KEY || '';
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_SENDER || this.DEFAULT_ADMIN_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || this.DEFAULT_SENDER_NAME;

    const isPlaceholder =
      !apiKey || apiKey.trim().length === 0 || apiKey.includes('test') || apiKey.length < 20;

    if (isPlaceholder) {
      console.log(
        `📧 [DEV_EMAIL_SIMULATED] Subject: "${subject}" -> To: ${to} (Brevo Key not live or placeholder)`,
      );
      return { success: true, messageId: `simulated_${Date.now()}` };
    }

    try {
      const response = await axios.post(
        this.BREVO_ENDPOINT,
        {
          sender: { name: senderName, email: senderEmail },
          to: [{ email: to.trim().toLowerCase() }],
          subject,
          htmlContent,
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

      return {
        success: true,
        messageId: response.data?.messageId || `brevo_${Date.now()}`,
      };
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || 'Brevo API call failed';
      console.error(`❌ [BREVO_DISPATCH_ERROR] To: ${to} | Error:`, msg);

      // Graceful fallback for local development if sender verification or credentials fail
      return {
        success: process.env.NODE_ENV !== 'production',
        error: msg,
      };
    }
  }

  /**
   * 1. 👑 SENDS FOUNDING 50 OFFER EMAIL TO APPROVED SELLERS
   */
  public static async sendFoundingOfferToApprovedSellers(options: {
    testOnly?: boolean;
    testEmail?: string;
  }): Promise<BroadcastResult> {
    const testRecipient = options.testEmail || this.DEFAULT_ADMIN_EMAIL;

    // Fetch approved shops
    const shops = await prisma.shop.findMany({
      where: {
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        foundingSlotNumber: true,
        commissionRate: true,
        owner: {
          select: { name: true, email: true },
        },
      },
      orderBy: { foundingSlotNumber: 'asc' },
    });

    if (shops.length === 0 && !options.testOnly) {
      return {
        success: false,
        totalRecipients: 0,
        sentCount: 0,
        failedCount: 0,
        message: 'No approved sellers found in database.',
      };
    }

    // Handle Test Mode (Single email to Admin)
    if (options.testOnly) {
      const sampleShop = shops[0] || {
        name: 'Sample Boutique',
        foundingSlotNumber: 1,
        owner: { name: 'Sample Merchant' },
      };

      const emailData = renderFounding50OfferEmail({
        sellerName: sampleShop.owner?.name || 'Boutique Partner',
        shopName: sampleShop.name,
        slotNumber: sampleShop.foundingSlotNumber || 1,
        commissionRateTier1: 5.0,
        commissionRateTier2: 7.5,
      });

      const res = await this.dispatchEmail(
        testRecipient,
        `[TEST] ${emailData.subject}`,
        emailData.html,
      );

      return {
        success: res.success,
        totalRecipients: 1,
        sentCount: res.success ? 1 : 0,
        failedCount: res.success ? 0 : 1,
        message: res.success
          ? `Test Founding 50 email successfully dispatched to ${testRecipient}`
          : `Failed to send test email: ${res.error}`,
        testEmailSentTo: testRecipient,
      };
    }

    // Full Broadcast to all approved sellers
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const shop of shops) {
      const recipientEmail = shop.email || shop.owner?.email;
      if (!recipientEmail || !recipientEmail.includes('@')) {
        continue;
      }

      const emailData = renderFounding50OfferEmail({
        sellerName: shop.owner?.name || 'Boutique Partner',
        shopName: shop.name,
        slotNumber: shop.foundingSlotNumber || 1,
        commissionRateTier1: 5.0,
        commissionRateTier2: 7.5,
      });

      const res = await this.dispatchEmail(recipientEmail, emailData.subject, emailData.html);
      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
        if (res.error) errors.push(`${shop.name} (${recipientEmail}): ${res.error}`);
      }

      // Small 150ms pause to protect API rate limit
      await new Promise((r) => setTimeout(r, 150));
    }

    return {
      success: sentCount > 0,
      totalRecipients: shops.length,
      sentCount,
      failedCount,
      message: `Founding 50 offer email sent to ${sentCount} of ${shops.length} approved boutiques.`,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
    };
  }

  /**
   * Lifecycle Hook: Automatically sends Founding 50 Welcome Email when a seller is approved.
   */
  public static async autoSendFoundingOfferOnSellerApproval(shopId: string): Promise<boolean> {
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: {
          name: true,
          email: true,
          foundingSlotNumber: true,
          owner: { select: { name: true, email: true } },
        },
      });

      if (!shop) return false;
      const recipientEmail = shop.email || shop.owner?.email;
      if (!recipientEmail || !recipientEmail.includes('@')) return false;

      const emailData = renderFounding50OfferEmail({
        sellerName: shop.owner?.name || 'Boutique Partner',
        shopName: shop.name,
        slotNumber: shop.foundingSlotNumber || 1,
        commissionRateTier1: 5.0,
        commissionRateTier2: 7.5,
      });

      const res = await this.dispatchEmail(recipientEmail, emailData.subject, emailData.html);
      return res.success;
    } catch (err) {
      console.warn('⚠️ Auto Founding 50 email hook failed for shop:', shopId, err);
      return false;
    }
  }

  /**
   * 2. 🎁 SENDS REFER & EARN ANNOUNCEMENT EMAIL TO REGISTERED USERS
   */
  public static async sendReferralLaunchToUsers(options: {
    testOnly?: boolean;
    testEmail?: string;
  }): Promise<BroadcastResult> {
    const testRecipient = options.testEmail || this.DEFAULT_ADMIN_EMAIL;

    // Test Mode
    if (options.testOnly) {
      const emailData = renderReferAndEarnEmail({
        customerName: 'Gurvinder Singh',
        referralCode: 'JIIVAA-TEST-0218',
        referralLink: 'https://jiivaakart.com/register?ref=JIIVAA-TEST-0218',
        whatsAppShareUrl:
          'https://api.whatsapp.com/send?text=Hey!%20Check%20out%20JiivaaKart%20and%20get%20Flat%20Rs.50%20OFF!',
        welcomeDiscount: 50,
        referrerReward: 50,
      });

      const res = await this.dispatchEmail(
        testRecipient,
        `[TEST] ${emailData.subject}`,
        emailData.html,
      );

      return {
        success: res.success,
        totalRecipients: 1,
        sentCount: res.success ? 1 : 0,
        failedCount: res.success ? 0 : 1,
        message: res.success
          ? `Test Refer & Earn email dispatched to ${testRecipient}`
          : `Failed to send test email: ${res.error}`,
        testEmailSentTo: testRecipient,
      };
    }

    // Broadcast to registered users with email
    const users = await prisma.user.findMany({
      where: {
        email: { not: null },
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
    });

    const validUsers = users.filter((u) => u.email && u.email.includes('@'));

    let sentCount = 0;
    let failedCount = 0;

    for (const user of validUsers) {
      const code = `JK-${(user.name || 'USER')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .slice(0, 4)}-${(user.mobile || user.id).slice(-4)}`;

      const emailData = renderReferAndEarnEmail({
        customerName: user.name || 'Fashion Shopper',
        referralCode: code,
        referralLink: `https://jiivaakart.com/register?ref=${code}`,
        whatsAppShareUrl: `https://api.whatsapp.com/send?text=${encodeURIComponent(
          `Hey! I'm shopping verified boutique fashion on JiivaaKart. Use my invite code *${code}* or click https://jiivaakart.com/register?ref=${code} to get Flat ₹50 OFF on your first order! 🛍️✨`,
        )}`,
        welcomeDiscount: 50,
        referrerReward: 50,
      });

      const res = await this.dispatchEmail(user.email!, emailData.subject, emailData.html);
      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      await new Promise((r) => setTimeout(r, 150));
    }

    return {
      success: sentCount > 0,
      totalRecipients: validUsers.length,
      sentCount,
      failedCount,
      message: `Refer & Earn email sent to ${sentCount} of ${validUsers.length} registered users.`,
    };
  }

  /**
   * 3. 👗 SENDS PRODUCT SHOWCASE & TRENDING DEALS EMAIL TO USERS
   */
  public static async sendProductShowcaseToUsers(options: {
    testOnly?: boolean;
    testEmail?: string;
    headline?: string;
  }): Promise<BroadcastResult> {
    const testRecipient = options.testEmail || this.DEFAULT_ADMIN_EMAIL;

    // Fetch top 4 active products with images
    const dbProducts = await prisma.product.findMany({
      where: {
        status: 'active',
        deletedAt: null,
      },
      take: 4,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        shop: { select: { name: true } },
        images: {
          take: 1,
          select: { imageUrl: true },
        },
      },
    });

    const products: ProductShowcaseItem[] = dbProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      shopName: p.shop?.name || 'Verified Boutique',
      imageUrl: p.images[0]?.imageUrl || null,
    }));

    // Test Mode
    if (options.testOnly) {
      const emailData = renderProductShowcaseEmail({
        customerName: 'Gurvinder Singh',
        headline: options.headline || 'Curated Indian Boutique Styles Starting at ₹499',
        products,
      });

      const res = await this.dispatchEmail(
        testRecipient,
        `[TEST] ${emailData.subject}`,
        emailData.html,
      );

      return {
        success: res.success,
        totalRecipients: 1,
        sentCount: res.success ? 1 : 0,
        failedCount: res.success ? 0 : 1,
        message: res.success
          ? `Test Product Showcase email dispatched to ${testRecipient}`
          : `Failed to send test email: ${res.error}`,
        testEmailSentTo: testRecipient,
      };
    }

    // Broadcast to users
    const users = await prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, name: true, email: true },
    });
    const validUsers = users.filter((u) => u.email && u.email.includes('@'));

    let sentCount = 0;
    let failedCount = 0;

    for (const user of validUsers) {
      const emailData = renderProductShowcaseEmail({
        customerName: user.name || 'Valued Customer',
        headline: options.headline || 'Curated Indian Boutique Styles You Will Love',
        products,
      });

      const res = await this.dispatchEmail(user.email!, emailData.subject, emailData.html);
      if (res.success) sentCount++;
      else failedCount++;

      await new Promise((r) => setTimeout(r, 150));
    }

    return {
      success: sentCount > 0,
      totalRecipients: validUsers.length,
      sentCount,
      failedCount,
      message: `Product Showcase email sent to ${sentCount} of ${validUsers.length} users.`,
    };
  }

  /**
   * 4. 📊 GETS MARKETING AUDIENCE STATS
   */
  public static async getMarketingAudienceStats() {
    const [approvedSellers, registeredUsers, activeProducts, pushSubscribers] = await Promise.all([
      prisma.shop.count({
        where: { status: 'APPROVED', deletedAt: null },
      }),
      prisma.user.count({
        where: { email: { not: null } },
      }),
      prisma.product.count({
        where: { status: 'active', deletedAt: null },
      }),
      PushNotificationService.getSubscribersCount().catch(() => 0),
    ]);

    return {
      approvedSellersCount: approvedSellers,
      registeredUsersCount: registeredUsers,
      activeProductsCount: activeProducts,
      pushSubscribersCount: pushSubscribers,
      vapidPublicKey: PushNotificationService.getPublicKey(),
    };
  }
}

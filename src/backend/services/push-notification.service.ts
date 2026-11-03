import webpush from 'web-push';

import { prisma } from '@/lib/prisma';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
}

export interface ClientPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationSettings {
  autoPushEnabled: boolean;
  cadenceHours: number; // 0.5, 1, 2, 4, 12, 24
  cadenceMinutes: number; // 30, 60, 120, 240, 720, 1440
  dailyLimit: number;
  autoSellerAlerts: boolean;
  autoProductAlerts: boolean;
  abandonedCartAlerts: boolean;
  abandonedWishlistAlerts: boolean;
  cartRecoveryDelayMins: number; // 30 mins
}

export interface QueueItem {
  id: string;
  type:
    | 'NEW_SELLER'
    | 'NEW_PRODUCT'
    | 'CATALOG_DROP'
    | 'PROMO'
    | 'ABANDONED_CART'
    | 'WISHLIST_REMINDER';
  title: string;
  body: string;
  url: string;
  image?: string;
  icon?: string;
  entityId?: string;
  entityName?: string;
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  priority: number;
  scheduledFor: string;
  sentAt?: string;
  recipientsCount: number;
  createdAt: string;
}

export class PushNotificationService {
  private static tableEnsured = false;

  // Fallback VAPID keys generated for JiivaaKart PWA Push Notifications
  public static readonly DEFAULT_VAPID_PUBLIC =
    'BF1v3_D7UgvnWJXFYuhVlzR37KsY7p2RWUt_clPK8y_cy9OkeMGEUTiMeMZ_Ykq4rMmAvm4B1B4QxgaW_3XZllc';
  private static readonly DEFAULT_VAPID_PRIVATE = 'chnMVkBL_mD3aIP03uBUdrgIs8fMYZ56ji8aMPMuUiM';
  public static readonly DEFAULT_VAPID_SUBJECT = 'mailto:support@jiivaakart.com';

  private static configureWebPush(): void {
    const publicKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      process.env.VAPID_PUBLIC_KEY ||
      this.DEFAULT_VAPID_PUBLIC;

    const privateKey = process.env.VAPID_PRIVATE_KEY || this.DEFAULT_VAPID_PRIVATE;
    const subject = process.env.VAPID_SUBJECT || this.DEFAULT_VAPID_SUBJECT;

    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] VAPID configuration warning:', e);
    }
  }

  public static getPublicKey(): string {
    return (
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      process.env.VAPID_PUBLIC_KEY ||
      this.DEFAULT_VAPID_PUBLIC
    );
  }

  /**
   * Lazily ensures PostgreSQL storage tables exist for push subscriptions, queue, and cadence settings.
   */
  public static async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      // 1. Ensure push_subscriptions and add last_notified_at column
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "push_subscriptions" (
          "id" VARCHAR(100) PRIMARY KEY,
          "endpoint" TEXT NOT NULL UNIQUE,
          "p256dh" TEXT NOT NULL,
          "auth" TEXT NOT NULL,
          "user_id" VARCHAR(100),
          "user_agent" TEXT,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "push_subscriptions" ADD COLUMN IF NOT EXISTS "last_notified_at" TIMESTAMP WITH TIME ZONE;
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions"("endpoint");
      `);

      // 2. Ensure notification_queue table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "notification_queue" (
          "id" VARCHAR(100) PRIMARY KEY,
          "type" VARCHAR(50) NOT NULL,
          "title" VARCHAR(200) NOT NULL,
          "body" TEXT NOT NULL,
          "url" TEXT DEFAULT '/',
          "image" TEXT,
          "icon" TEXT DEFAULT '/icons/icon-192x192.png',
          "entity_id" VARCHAR(100),
          "entity_name" VARCHAR(200),
          "status" VARCHAR(50) DEFAULT 'PENDING',
          "priority" INTEGER DEFAULT 1,
          "scheduled_for" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "sent_at" TIMESTAMP WITH TIME ZONE,
          "recipients_count" INTEGER DEFAULT 0,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "idx_notif_queue_status_sched" ON "notification_queue"("status", "scheduled_for");
      `);

      // 3. Ensure notification_settings table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "notification_settings" (
          "id" VARCHAR(50) PRIMARY KEY,
          "auto_push_enabled" BOOLEAN DEFAULT true,
          "cadence_hours" NUMERIC DEFAULT 4,
          "cadence_minutes" INTEGER DEFAULT 240,
          "daily_limit" INTEGER DEFAULT 3,
          "auto_seller_alerts" BOOLEAN DEFAULT true,
          "auto_product_alerts" BOOLEAN DEFAULT true,
          "abandoned_cart_alerts" BOOLEAN DEFAULT true,
          "abandoned_wishlist_alerts" BOOLEAN DEFAULT true,
          "cart_recovery_delay_mins" INTEGER DEFAULT 30,
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "cadence_minutes" INTEGER DEFAULT 240;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "abandoned_cart_alerts" BOOLEAN DEFAULT true;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "abandoned_wishlist_alerts" BOOLEAN DEFAULT true;
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "notification_settings" ADD COLUMN IF NOT EXISTS "cart_recovery_delay_mins" INTEGER DEFAULT 30;
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "notification_settings" ("id", "auto_push_enabled", "cadence_hours", "cadence_minutes", "daily_limit", "auto_seller_alerts", "auto_product_alerts", "abandoned_cart_alerts", "abandoned_wishlist_alerts", "cart_recovery_delay_mins")
        VALUES ('global', true, 4, 240, 3, true, true, true, true, 30)
        ON CONFLICT ("id") DO NOTHING;
      `);

      this.tableEnsured = true;
    } catch (err) {
      console.warn('⚠️ [PushNotificationService] Schema check:', err);
    }
  }

  /**
   * Saves or updates a browser push subscription.
   */
  public static async saveSubscription(
    sub: ClientPushSubscription,
    userId?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.ensureTable();

    if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { success: false, message: 'Invalid subscription object.' };
    }

    try {
      const id = `push_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO "push_subscriptions" ("id", "endpoint", "p256dh", "auth", "user_id", "user_agent")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("endpoint") DO UPDATE
        SET "p256dh" = EXCLUDED."p256dh",
            "auth" = EXCLUDED."auth",
            "user_id" = COALESCE(EXCLUDED."user_id", "push_subscriptions"."user_id"),
            "created_at" = CURRENT_TIMESTAMP;
      `,
        id,
        sub.endpoint,
        sub.keys.p256dh,
        sub.keys.auth,
        userId || null,
        userAgent || null,
      );

      return { success: true, message: 'Push subscription successfully registered!' };
    } catch (err: any) {
      console.error('❌ Failed to save push subscription:', err);
      return { success: false, message: err.message || 'Database error saving push subscription.' };
    }
  }

  /**
   * Returns count of active push subscribers.
   */
  public static async getSubscribersCount(): Promise<number> {
    await this.ensureTable();
    try {
      const res: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM "push_subscriptions";`,
      );
      return Number(res[0]?.count || 0);
    } catch {
      return 0;
    }
  }

  /**
   * Returns count of total vs eligible subscribers (who have not received an alert within cadenceMinutes).
   */
  public static async getSubscribersCadenceStats(cadenceMinutes = 240): Promise<{
    total: number;
    eligible: number;
    pendingQueueCount: number;
    abandonedCartsCount: number;
  }> {
    await this.ensureTable();
    try {
      const [subsRes, queueRes, cartsRes]: [any, any, any] = await Promise.all([
        prisma.$queryRawUnsafe(
          `SELECT 
             COUNT(*)::int as total,
             COUNT(CASE WHEN last_notified_at IS NULL OR last_notified_at <= NOW() - ($1 || ' minutes')::interval THEN 1 END)::int as eligible
           FROM "push_subscriptions";`,
          cadenceMinutes,
        ),
        prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as count FROM "notification_queue" WHERE status = 'PENDING';`,
        ),
        prisma.cart
          .count({
            where: {
              updatedAt: {
                lte: new Date(Date.now() - 30 * 60 * 1000),
              },
              items: { some: {} },
            },
          })
          .catch(() => 0),
      ]);

      return {
        total: Number(subsRes[0]?.total || 0),
        eligible: Number(subsRes[0]?.eligible || 0),
        pendingQueueCount: Number(queueRes[0]?.count || 0),
        abandonedCartsCount: Number(cartsRes || 0),
      };
    } catch {
      return { total: 0, eligible: 0, pendingQueueCount: 0, abandonedCartsCount: 0 };
    }
  }

  /**
   * Fetch Global Notification & Cadence Settings.
   */
  public static async getSettings(): Promise<NotificationSettings> {
    await this.ensureTable();
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT 
           auto_push_enabled as "autoPushEnabled", 
           cadence_hours as "cadenceHours",
           cadence_minutes as "cadenceMinutes",
           daily_limit as "dailyLimit", 
           auto_seller_alerts as "autoSellerAlerts", 
           auto_product_alerts as "autoProductAlerts",
           abandoned_cart_alerts as "abandonedCartAlerts",
           abandoned_wishlist_alerts as "abandonedWishlistAlerts",
           cart_recovery_delay_mins as "cartRecoveryDelayMins"
         FROM "notification_settings" 
         WHERE "id" = 'global' 
         LIMIT 1;`,
      );
      if (Array.isArray(rows) && rows[0]) {
        const cHours = Number(rows[0].cadenceHours) || 4;
        const cMins = Number(rows[0].cadenceMinutes) || Math.round(cHours * 60) || 240;
        return {
          autoPushEnabled: Boolean(rows[0].autoPushEnabled),
          cadenceHours: cMins / 60,
          cadenceMinutes: cMins,
          dailyLimit: Number(rows[0].dailyLimit) || 3,
          autoSellerAlerts: Boolean(rows[0].autoSellerAlerts),
          autoProductAlerts: Boolean(rows[0].autoProductAlerts),
          abandonedCartAlerts: rows[0].abandonedCartAlerts !== false,
          abandonedWishlistAlerts: rows[0].abandonedWishlistAlerts !== false,
          cartRecoveryDelayMins: Number(rows[0].cartRecoveryDelayMins) || 30,
        };
      }
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] getSettings fallback:', e);
    }
    return {
      autoPushEnabled: true,
      cadenceHours: 4,
      cadenceMinutes: 240,
      dailyLimit: 3,
      autoSellerAlerts: true,
      autoProductAlerts: true,
      abandonedCartAlerts: true,
      abandonedWishlistAlerts: true,
      cartRecoveryDelayMins: 30,
    };
  }

  /**
   * Update Global Cadence Settings.
   */
  public static async updateSettings(
    partial: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    await this.ensureTable();
    const current = await this.getSettings();
    const updated: NotificationSettings = { ...current, ...partial };

    // Sync minutes and hours
    if (partial.cadenceMinutes) {
      updated.cadenceMinutes = partial.cadenceMinutes;
      updated.cadenceHours = partial.cadenceMinutes / 60;
    } else if (partial.cadenceHours) {
      updated.cadenceHours = partial.cadenceHours;
      updated.cadenceMinutes = Math.round(partial.cadenceHours * 60);
    }

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "notification_settings"
         SET auto_push_enabled = $1, 
             cadence_hours = $2, 
             cadence_minutes = $3,
             daily_limit = $4, 
             auto_seller_alerts = $5, 
             auto_product_alerts = $6,
             abandoned_cart_alerts = $7,
             abandoned_wishlist_alerts = $8,
             cart_recovery_delay_mins = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE "id" = 'global';`,
        updated.autoPushEnabled,
        updated.cadenceHours,
        updated.cadenceMinutes,
        updated.dailyLimit,
        updated.autoSellerAlerts,
        updated.autoProductAlerts,
        updated.abandonedCartAlerts,
        updated.abandonedWishlistAlerts,
        updated.cartRecoveryDelayMins,
      );
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] updateSettings fallback:', e);
    }
    return updated;
  }

  /**
   * Add a notification item to the drip queue.
   */
  public static async enqueueNotification(item: {
    type:
      | 'NEW_SELLER'
      | 'NEW_PRODUCT'
      | 'CATALOG_DROP'
      | 'PROMO'
      | 'ABANDONED_CART'
      | 'WISHLIST_REMINDER';
    title: string;
    body: string;
    url?: string;
    image?: string;
    icon?: string;
    entityId?: string;
    entityName?: string;
    priority?: number;
  }): Promise<{ success: boolean; id?: string }> {
    await this.ensureTable();
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    try {
      // Deduplicate if already queued in the last 24 hours for the same entity
      if (item.entityId) {
        const existing: any = await prisma
          .$queryRawUnsafe(
            `SELECT id FROM "notification_queue" WHERE entity_id = $1 AND type = $2 AND created_at >= NOW() - INTERVAL '24 hours' LIMIT 1;`,
            item.entityId,
            item.type,
          )
          .catch(() => []);
        if (Array.isArray(existing) && existing.length > 0) {
          return { success: false, id: existing[0].id };
        }
      }

      await prisma.$executeRawUnsafe(
        `INSERT INTO "notification_queue" ("id", "type", "title", "body", "url", "image", "icon", "entity_id", "entity_name", "status", "priority", "created_at")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10, CURRENT_TIMESTAMP);`,
        id,
        item.type,
        item.title,
        item.body,
        item.url || '/',
        item.image || null,
        item.icon || '/icons/icon-192x192.png',
        item.entityId || null,
        item.entityName || null,
        item.priority || 1,
      );
      return { success: true, id };
    } catch (err: any) {
      console.error('❌ [PushNotificationService] enqueueNotification error:', err);
      return { success: false };
    }
  }

  /**
   * Auto-Trigger: Hooked into Seller Approval.
   */
  public static async autoEnqueueSellerApproved(shop: {
    id: string;
    name: string;
    slug?: string | null;
    city?: string | null;
    logo?: string | null;
    banner?: string | null;
  }): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.autoPushEnabled || !settings.autoSellerAlerts) return;

      const cityName = shop.city ? ` (${shop.city})` : '';
      await this.enqueueNotification({
        type: 'NEW_SELLER',
        title: `🏪 New Boutique Live: ${shop.name}!`,
        body: `Explore verified handcrafted ethnic styles from ${shop.name}${cityName} now on JiivaaKart.`,
        url: `/shop/${shop.slug || shop.id}`,
        image: shop.banner || shop.logo || undefined,
        entityId: shop.id,
        entityName: shop.name,
        priority: 2, // Higher priority
      });
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] autoEnqueueSellerApproved error:', e);
    }
  }

  /**
   * Auto-Trigger: Hooked into Product Creation & Publishing.
   */
  public static async autoEnqueueProductAdded(product: {
    id: string;
    name: string;
    slug?: string | null;
    price: number | any;
    compareAtPrice?: number | null;
    images?: Array<{ imageUrl: string }>;
    shop?: { name: string } | null;
  }): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.autoPushEnabled || !settings.autoProductAlerts) return;

      const shopName = product.shop?.name ? ` by ${product.shop.name}` : '';
      const img = product.images?.[0]?.imageUrl || undefined;

      await this.enqueueNotification({
        type: 'NEW_PRODUCT',
        title: `✨ Fresh Arrival: ${product.name}!`,
        body: `New boutique collection${shopName} starting at ₹${product.price}. Tap to view exclusive styles before stock ends!`,
        url: `/product/${product.slug || product.id}`,
        image: img,
        entityId: product.id,
        entityName: product.name,
        priority: 1,
      });
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] autoEnqueueProductAdded error:', e);
    }
  }

  /**
   * Fetch current live products and approved shops for Admin 1-Click Push Dispatcher.
   */
  public static async getLiveCatalogForPush(): Promise<{
    products: Array<{
      id: string;
      name: string;
      slug: string;
      price: number;
      compareAtPrice?: number | null;
      imageUrl?: string;
      shopName: string;
      shopSlug: string;
    }>;
    shops: Array<{
      id: string;
      name: string;
      slug: string;
      city?: string | null;
      imageUrl?: string;
    }>;
  }> {
    try {
      const [products, shops] = await Promise.all([
        prisma.product.findMany({
          where: { status: 'active', deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            images: { take: 1, select: { imageUrl: true } },
            shop: { select: { name: true, slug: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.shop.findMany({
          where: { status: 'APPROVED', deletedAt: null },
          select: {
            id: true,
            name: true,
            slug: true,
            city: true,
            logo: true,
            banner: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        }),
      ]);

      return {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          imageUrl: p.images?.[0]?.imageUrl || undefined,
          shopName: p.shop?.name || 'Jiivaa Boutique',
          shopSlug: p.shop?.slug || 'shop',
        })),
        shops: shops.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          city: s.city,
          imageUrl: s.logo || s.banner || undefined,
        })),
      };
    } catch {
      return { products: [], shops: [] };
    }
  }

  /**
   * Enqueue a specific product or boutique with a chosen marketing template.
   */
  public static async enqueueCatalogItem(params: {
    targetType: 'PRODUCT' | 'SHOP';
    targetId: string;
    templateType?: 'TRENDING' | 'LOW_STOCK' | 'SPOTLIGHT' | 'WEEKEND_DEAL';
    customTitle?: string;
    customBody?: string;
    dispatchImmediate?: boolean;
  }): Promise<{ success: boolean; message: string; data?: any }> {
    await this.ensureTable();

    let title = params.customTitle || '';
    let body = params.customBody || '';
    let url = '/';
    let image: string | undefined = undefined;
    let entityName = '';

    if (params.targetType === 'PRODUCT') {
      const product = await prisma.product.findUnique({
        where: { id: params.targetId },
        include: { images: true, shop: true },
      });

      if (!product) {
        return { success: false, message: 'Product not found in catalog.' };
      }

      entityName = product.name;
      url = `/product/${product.slug || product.id}`;
      image = product.images?.[0]?.imageUrl || undefined;

      const shopTag = product.shop?.name ? ` by ${product.shop.name}` : '';

      switch (params.templateType) {
        case 'LOW_STOCK':
          title = title || `⚡ Few Pieces Left: ${product.name}!`;
          body =
            body ||
            `Limited boutique collection${shopTag} selling fast at ₹${product.price}. Claim yours before stock runs out!`;
          break;
        case 'WEEKEND_DEAL':
          title = title || `🎉 Special Boutique Deal: ${product.name}!`;
          body =
            body ||
            `Handcrafted luxury couture starting at ₹${product.price}. Tap to claim Flat ₹50 OFF at checkout!`;
          break;
        case 'TRENDING':
        default:
          title = title || `🔥 Trending Boutique Pick: ${product.name}!`;
          body =
            body ||
            `Loved by shoppers across India${shopTag} at ₹${product.price}. Tap to explore exclusive styles!`;
          break;
      }
    } else {
      const shop = await prisma.shop.findUnique({
        where: { id: params.targetId },
      });

      if (!shop) {
        return { success: false, message: 'Boutique shop not found.' };
      }

      entityName = shop.name;
      url = `/shop/${shop.slug || shop.id}`;
      image = shop.banner || shop.logo || undefined;
      const cityTag = shop.city ? ` in ${shop.city}` : '';

      title = title || `🏪 Boutique Spotlight: ${shop.name}!`;
      body =
        body ||
        `Explore verified handcrafted luxury lehengas, sarees and ethnic suits from ${shop.name}${cityTag} on JiivaaKart.`;
    }

    // Immediate dispatch option
    if (params.dispatchImmediate) {
      const dispatchRes = await this.broadcastPush({
        title,
        body,
        url,
        image,
      });

      return {
        success: true,
        message: `Dispatched immediately to ${dispatchRes.sent} screens (${dispatchRes.failed} failed).`,
        data: dispatchRes,
      };
    }

    // Queue for cadence delivery
    const enqueueRes = await this.enqueueNotification({
      type: params.targetType === 'PRODUCT' ? 'PROMO' : 'NEW_SELLER',
      title,
      body,
      url,
      image,
      entityId: params.targetId,
      entityName,
      priority: 2,
    });

    return {
      success: enqueueRes.success,
      message: enqueueRes.success
        ? `Added "${title}" to the Notification Drip Queue!`
        : `Could not queue item.`,
      data: { title, body, url },
    };
  }

  /**
   * Scan for abandoned carts (> 30 mins) and wishlists (> 2 hours) and auto-enqueue targeted recovery alerts.
   */
  public static async scanAndEnqueueAbandonedCartsAndWishlists(): Promise<{
    abandonedCartsQueued: number;
    abandonedWishlistsQueued: number;
  }> {
    await this.ensureTable();
    const settings = await this.getSettings();
    let abandonedCartsQueued = 0;
    let abandonedWishlistsQueued = 0;

    // 1. Scan Abandoned Carts
    if (settings.abandonedCartAlerts) {
      const delayMins = settings.cartRecoveryDelayMins || 30;
      try {
        const abandonedCarts = await prisma.cart.findMany({
          where: {
            updatedAt: {
              lte: new Date(Date.now() - delayMins * 60 * 1000),
              gte: new Date(Date.now() - 72 * 60 * 60 * 1000), // Within last 72 hours
            },
            items: { some: {} },
          },
          include: {
            items: {
              include: {
                product: {
                  include: { images: true, shop: true },
                },
              },
              take: 1,
            },
            user: {
              select: { id: true, name: true, mobile: true, email: true },
            },
          },
          take: 10,
        });

        for (const cart of abandonedCarts) {
          const firstItem = cart.items?.[0];
          if (!firstItem || !firstItem.product) continue;
          const product = firstItem.product;

          const dedupeKey = `cart_${cart.userId}_${product.id}`;
          const existing: any = await prisma
            .$queryRawUnsafe(
              `SELECT id FROM "notification_queue" WHERE entity_id = $1 AND created_at >= NOW() - INTERVAL '24 hours' LIMIT 1;`,
              dedupeKey,
            )
            .catch(() => []);

          if (Array.isArray(existing) && existing.length > 0) continue;

          // Check if an order was placed by this user after cart.updatedAt
          const recentOrder = await prisma.order
            .findFirst({
              where: {
                userId: cart.userId,
                createdAt: { gte: cart.updatedAt },
              },
              select: { id: true },
            })
            .catch(() => null);

          if (recentOrder) continue;

          const img = product.images?.[0]?.imageUrl || undefined;
          await this.enqueueNotification({
            type: 'ABANDONED_CART',
            title: `🛒 Aapka Cart Intezaar Kar Raha Hai!`,
            body: `${product.name} abhi bhi aapke cart me hai. Complete your order now & get Flat ₹50 OFF!`,
            url: `/cart`,
            image: img,
            entityId: dedupeKey,
            entityName: product.name,
            priority: 3, // Highest priority for conversion!
          });
          abandonedCartsQueued++;
        }
      } catch (err) {
        console.warn('⚠️ [PushNotificationService] scan abandoned carts error:', err);
      }
    }

    // 2. Scan Abandoned Wishlists
    if (settings.abandonedWishlistAlerts) {
      try {
        const wishlists = await prisma.wishlist.findMany({
          where: {
            createdAt: {
              lte: new Date(Date.now() - 2 * 60 * 60 * 1000), // > 2 hours
              gte: new Date(Date.now() - 72 * 60 * 60 * 1000),
            },
          },
          include: {
            product: {
              include: { images: true, shop: true },
            },
            user: {
              select: { id: true, name: true },
            },
          },
          take: 10,
        });

        for (const wl of wishlists) {
          if (!wl.product) continue;
          const product = wl.product;
          const dedupeKey = `wishlist_${wl.userId}_${product.id}`;

          const existing: any = await prisma
            .$queryRawUnsafe(
              `SELECT id FROM "notification_queue" WHERE entity_id = $1 AND created_at >= NOW() - INTERVAL '24 hours' LIMIT 1;`,
              dedupeKey,
            )
            .catch(() => []);

          if (Array.isArray(existing) && existing.length > 0) continue;

          const img = product.images?.[0]?.imageUrl || undefined;
          await this.enqueueNotification({
            type: 'WISHLIST_REMINDER',
            title: `❤️ Saved in Your Wishlist!`,
            body: `${product.name} is trending today! Tap to order your piece before stocks run out.`,
            url: `/product/${product.slug || product.id}`,
            image: img,
            entityId: dedupeKey,
            entityName: product.name,
            priority: 2,
          });
          abandonedWishlistsQueued++;
        }
      } catch (err) {
        console.warn('⚠️ [PushNotificationService] scan wishlists error:', err);
      }
    }

    return { abandonedCartsQueued, abandonedWishlistsQueued };
  }

  /**
   * Auto-enqueue rotating pick from existing catalog so queue is never empty.
   */
  public static async autoEnqueueRotatingCatalogPick(): Promise<boolean> {
    await this.ensureTable();
    try {
      const recentQueued: any = await prisma
        .$queryRawUnsafe(
          `SELECT type, entity_id FROM "notification_queue" ORDER BY created_at DESC LIMIT 6;`,
        )
        .catch(() => []);

      const recentProductIds = Array.isArray(recentQueued)
        ? recentQueued.map((q: any) => q.entity_id).filter(Boolean)
        : [];

      // Pick next active product not recently queued
      const product = await prisma.product.findFirst({
        where: {
          status: 'active',
          deletedAt: null,
          id: { notIn: recentProductIds },
        },
        include: { images: true, shop: true },
        orderBy: { createdAt: 'desc' },
      });

      if (product) {
        const templates = [
          {
            title: `🔥 Trending Boutique Pick: ${product.name}!`,
            body: `Handcrafted ethnic fashion starting ₹${product.price}${product.shop?.name ? ' from ' + product.shop.name : ''}. Check new designs!`,
          },
          {
            title: `⚡ Limited Stock Alert: ${product.name}!`,
            body: `Fast selling boutique couture at ₹${product.price}. Tap to claim Flat ₹50 OFF on your order!`,
          },
          {
            title: `✨ Fashion Insider: ${product.name}!`,
            body: `Curated Indian ethnic style by ${product.shop?.name || 'Jiivaa Boutiques'}. Tap to explore now.`,
          },
        ];

        const selected = templates[Math.floor(Math.random() * templates.length)];
        const img = product.images?.[0]?.imageUrl || undefined;

        await this.enqueueNotification({
          type: 'PROMO',
          title: selected.title,
          body: selected.body,
          url: `/product/${product.slug || product.id}`,
          image: img,
          entityId: product.id,
          entityName: product.name,
          priority: 1,
        });
        return true;
      }

      // If no product found, pick an approved boutique
      const shop = await prisma.shop.findFirst({
        where: { status: 'APPROVED', deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      });

      if (shop) {
        await this.autoEnqueueSellerApproved(shop);
        return true;
      }
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] autoEnqueueRotatingCatalogPick error:', e);
    }
    return false;
  }

  /**
   * Returns latest Queue items for Admin Dashboard.
   */
  public static async getQueueItems(limit = 20): Promise<QueueItem[]> {
    await this.ensureTable();
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT id, type, title, body, url, image, icon, entity_id as "entityId", entity_name as "entityName", status, priority, scheduled_for as "scheduledFor", sent_at as "sentAt", recipients_count as "recipientsCount", created_at as "createdAt"
         FROM "notification_queue"
         ORDER BY CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END, created_at DESC
         LIMIT $1;`,
        limit,
      );
      if (Array.isArray(rows)) {
        return rows.map((r) => ({
          id: String(r.id),
          type: r.type,
          title: r.title,
          body: r.body,
          url: r.url || '/',
          image: r.image || undefined,
          icon: r.icon || undefined,
          entityId: r.entityId || undefined,
          entityName: r.entityName || undefined,
          status: r.status,
          priority: Number(r.priority) || 1,
          scheduledFor: r.scheduledFor
            ? new Date(r.scheduledFor).toISOString()
            : new Date().toISOString(),
          sentAt: r.sentAt ? new Date(r.sentAt).toISOString() : undefined,
          recipientsCount: Number(r.recipientsCount) || 0,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] getQueueItems fallback:', e);
    }
    return [];
  }

  /**
   * Delete or cancel a queue item.
   */
  public static async cancelQueueItem(id: string): Promise<boolean> {
    await this.ensureTable();
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "notification_queue" WHERE id = $1 AND status = 'PENDING';`,
        id,
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Smart Cadence Dispatcher with 30m / 1h / custom interval support:
   * Dispatches the highest-priority pending notification to subscribers whose last notification
   * was received at least cadenceMinutes ago.
   */
  public static async dispatchCadence(options?: { force?: boolean }): Promise<{
    success: boolean;
    dispatched: boolean;
    message: string;
    item?: any;
    sentCount: number;
    failedCount: number;
    eligibleCount: number;
  }> {
    await this.ensureTable();
    const settings = await this.getSettings();

    if (!settings.autoPushEnabled && !options?.force) {
      return {
        success: true,
        dispatched: false,
        message: 'Auto-push cadence engine is currently paused in settings.',
        sentCount: 0,
        failedCount: 0,
        eligibleCount: 0,
      };
    }

    // 0. Proactively scan for abandoned carts & wishlists
    await this.scanAndEnqueueAbandonedCartsAndWishlists().catch(() => {});

    // 1. Pick top pending item
    let pendingRows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "notification_queue"
       WHERE status = 'PENDING'
       ORDER BY priority DESC, created_at ASC
       LIMIT 1;`,
    );

    // If queue is completely empty, auto-enqueue next rotating product/boutique
    if (!Array.isArray(pendingRows) || pendingRows.length === 0) {
      await this.autoEnqueueRotatingCatalogPick().catch(() => {});
      pendingRows = await prisma.$queryRawUnsafe(
        `SELECT * FROM "notification_queue"
         WHERE status = 'PENDING'
         ORDER BY priority DESC, created_at ASC
         LIMIT 1;`,
      );
    }

    if (!Array.isArray(pendingRows) || pendingRows.length === 0) {
      return {
        success: true,
        dispatched: false,
        message: 'Notification queue is empty. No pending new products or boutique alerts to send.',
        sentCount: 0,
        failedCount: 0,
        eligibleCount: 0,
      };
    }

    const item = pendingRows[0];

    // 2. Find eligible subscribers (enforcing frequency cap: minimum cadenceMinutes gap)
    const cadenceMinutes = settings.cadenceMinutes || Math.round((settings.cadenceHours || 4) * 60);
    const subscribers: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "endpoint", "p256dh", "auth" 
       FROM "push_subscriptions"
       WHERE last_notified_at IS NULL OR last_notified_at <= NOW() - ($1 || ' minutes')::interval;`,
      cadenceMinutes,
    );

    const intervalLabel =
      cadenceMinutes < 60
        ? `${cadenceMinutes} minutes`
        : `${(cadenceMinutes / 60).toFixed(1).replace('.0', '')} hours`;

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return {
        success: true,
        dispatched: false,
        message: `Cadence frequency cap active: All subscribers received an alert within the last ${intervalLabel}. Queue item "${item.title}" retained for the next time window.`,
        item: { id: item.id, title: item.title },
        sentCount: 0,
        failedCount: 0,
        eligibleCount: 0,
      };
    }

    // 3. Dispatch web push to eligible subscribers
    this.configureWebPush();
    const stringPayload = JSON.stringify({
      title: item.title,
      body: item.body,
      url: item.url || '/',
      icon: item.icon || '/icons/icon-192x192.png',
      image: item.image || undefined,
    });

    let sentCount = 0;
    let failedCount = 0;
    const successfulEndpoints: string[] = [];
    const expiredEndpoints: string[] = [];

    for (const sub of subscribers) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(pushSub, stringPayload);
        sentCount++;
        successfulEndpoints.push(sub.endpoint);
      } catch (err: any) {
        failedCount++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // 4. Update last_notified_at for successfully delivered devices
    if (successfulEndpoints.length > 0) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "push_subscriptions"
           SET last_notified_at = CURRENT_TIMESTAMP
           WHERE endpoint = ANY($1::text[]);`,
          successfulEndpoints,
        );
      } catch (err) {
        console.warn('⚠️ Could not update last_notified_at:', err);
      }
    }

    // 5. Clean up expired endpoints
    if (expiredEndpoints.length > 0) {
      try {
        for (const ep of expiredEndpoints) {
          await prisma.$executeRawUnsafe(
            `DELETE FROM "push_subscriptions" WHERE "endpoint" = $1;`,
            ep,
          );
        }
      } catch {}
    }

    // 6. Mark queue item as SENT
    await prisma.$executeRawUnsafe(
      `UPDATE "notification_queue"
       SET status = 'SENT', sent_at = CURRENT_TIMESTAMP, recipients_count = $1
       WHERE id = $2;`,
      sentCount,
      item.id,
    );

    return {
      success: true,
      dispatched: sentCount > 0,
      message: `Cadence delivered "${item.title}" to ${sentCount} eligible subscriber(s) (${failedCount} failed).`,
      item: { id: item.id, title: item.title, body: item.body },
      sentCount,
      failedCount,
      eligibleCount: subscribers.length,
    };
  }

  /**
   * Broadcasts Web Push notification to all active browser endpoints (Manual Override).
   */
  public static async broadcastPush(
    payload: PushPayload,
  ): Promise<{ total: number; sent: number; failed: number }> {
    await this.ensureTable();
    this.configureWebPush();

    const subscriptions: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "endpoint", "p256dh", "auth" FROM "push_subscriptions";`,
    );

    let sent = 0;
    let failed = 0;
    const successfulEndpoints: string[] = [];
    const expiredEndpoints: string[] = [];

    const stringPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icons/icon-192x192.png',
      image: payload.image || undefined,
    });

    for (const sub of subscriptions) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, stringPayload);
        sent++;
        successfulEndpoints.push(sub.endpoint);
      } catch (err: any) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
    }

    // Update last_notified_at for manual broadcast too so frequency capping protects them
    if (successfulEndpoints.length > 0) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "push_subscriptions"
           SET last_notified_at = CURRENT_TIMESTAMP
           WHERE endpoint = ANY($1::text[]);`,
          successfulEndpoints,
        );
      } catch {}
    }

    // Clean up expired tokens
    if (expiredEndpoints.length > 0) {
      try {
        for (const ep of expiredEndpoints) {
          await prisma.$executeRawUnsafe(
            `DELETE FROM "push_subscriptions" WHERE "endpoint" = $1;`,
            ep,
          );
        }
      } catch (e) {
        console.warn('⚠️ Could not cleanup expired push endpoints:', e);
      }
    }

    return {
      total: subscriptions.length,
      sent,
      failed,
    };
  }
}

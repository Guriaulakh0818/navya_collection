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
  cadenceHours: number;
  dailyLimit: number;
  autoSellerAlerts: boolean;
  autoProductAlerts: boolean;
}

export interface QueueItem {
  id: string;
  type: 'NEW_SELLER' | 'NEW_PRODUCT' | 'CATALOG_DROP' | 'PROMO';
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
          "cadence_hours" INTEGER DEFAULT 4,
          "daily_limit" INTEGER DEFAULT 3,
          "auto_seller_alerts" BOOLEAN DEFAULT true,
          "auto_product_alerts" BOOLEAN DEFAULT true,
          "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await prisma.$executeRawUnsafe(`
        INSERT INTO "notification_settings" ("id", "auto_push_enabled", "cadence_hours", "daily_limit", "auto_seller_alerts", "auto_product_alerts")
        VALUES ('global', true, 4, 3, true, true)
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
   * Returns count of total vs eligible subscribers (who have not received an alert within cadenceHours).
   */
  public static async getSubscribersCadenceStats(cadenceHours = 4): Promise<{
    total: number;
    eligible: number;
    pendingQueueCount: number;
  }> {
    await this.ensureTable();
    try {
      const [subsRes, queueRes]: [any, any] = await Promise.all([
        prisma.$queryRawUnsafe(
          `SELECT 
             COUNT(*)::int as total,
             COUNT(CASE WHEN last_notified_at IS NULL OR last_notified_at <= NOW() - ($1 || ' hours')::interval THEN 1 END)::int as eligible
           FROM "push_subscriptions";`,
          cadenceHours,
        ),
        prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::int as count FROM "notification_queue" WHERE status = 'PENDING';`,
        ),
      ]);

      return {
        total: Number(subsRes[0]?.total || 0),
        eligible: Number(subsRes[0]?.eligible || 0),
        pendingQueueCount: Number(queueRes[0]?.count || 0),
      };
    } catch {
      return { total: 0, eligible: 0, pendingQueueCount: 0 };
    }
  }

  /**
   * Fetch Global Notification & Cadence Settings.
   */
  public static async getSettings(): Promise<NotificationSettings> {
    await this.ensureTable();
    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT auto_push_enabled as "autoPushEnabled", cadence_hours as "cadenceHours", daily_limit as "dailyLimit", auto_seller_alerts as "autoSellerAlerts", auto_product_alerts as "autoProductAlerts" 
         FROM "notification_settings" 
         WHERE "id" = 'global' 
         LIMIT 1;`,
      );
      if (Array.isArray(rows) && rows[0]) {
        return {
          autoPushEnabled: Boolean(rows[0].autoPushEnabled),
          cadenceHours: Number(rows[0].cadenceHours) || 4,
          dailyLimit: Number(rows[0].dailyLimit) || 3,
          autoSellerAlerts: Boolean(rows[0].autoSellerAlerts),
          autoProductAlerts: Boolean(rows[0].autoProductAlerts),
        };
      }
    } catch (e) {
      console.warn('⚠️ [PushNotificationService] getSettings fallback:', e);
    }
    return {
      autoPushEnabled: true,
      cadenceHours: 4,
      dailyLimit: 3,
      autoSellerAlerts: true,
      autoProductAlerts: true,
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
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "notification_settings"
         SET auto_push_enabled = $1, cadence_hours = $2, daily_limit = $3, auto_seller_alerts = $4, auto_product_alerts = $5, updated_at = CURRENT_TIMESTAMP
         WHERE "id" = 'global';`,
        updated.autoPushEnabled,
        updated.cadenceHours,
        updated.dailyLimit,
        updated.autoSellerAlerts,
        updated.autoProductAlerts,
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
    type: 'NEW_SELLER' | 'NEW_PRODUCT' | 'CATALOG_DROP' | 'PROMO';
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
      // Deduplicate if already queued in the last 48 hours for the same entity
      if (item.entityId) {
        const existing: any = await prisma
          .$queryRawUnsafe(
            `SELECT id FROM "notification_queue" WHERE entity_id = $1 AND type = $2 AND created_at >= NOW() - INTERVAL '48 hours' LIMIT 1;`,
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
        priority: 2, // Higher priority than individual products
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
   * Returns latest Queue items for Admin Dashboard.
   */
  public static async getQueueItems(limit = 15): Promise<QueueItem[]> {
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
   * Smart Cadence Dispatcher (Industry Standard Drip & Frequency Capping):
   * Dispatches the highest-priority pending notification to subscribers whose last notification
   * was received at least cadenceHours ago.
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

    // 1. Pick top pending item
    let pendingRows: any = await prisma.$queryRawUnsafe(
      `SELECT * FROM "notification_queue"
       WHERE status = 'PENDING'
       ORDER BY priority DESC, created_at ASC
       LIMIT 1;`,
    );

    // If queue is completely empty, optionally generate a fresh featured boutique pick
    if (!Array.isArray(pendingRows) || pendingRows.length === 0) {
      try {
        const topProduct = await prisma.product.findFirst({
          where: { status: 'active', deletedAt: null },
          include: { images: true, shop: true },
          orderBy: { createdAt: 'desc' },
        });

        if (topProduct) {
          await this.autoEnqueueProductAdded(topProduct as any);
          pendingRows = await prisma.$queryRawUnsafe(
            `SELECT * FROM "notification_queue"
             WHERE status = 'PENDING'
             ORDER BY priority DESC, created_at ASC
             LIMIT 1;`,
          );
        }
      } catch {}
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

    // 2. Find eligible subscribers (enforcing frequency cap: minimum cadenceHours gap)
    const cadenceHours = settings.cadenceHours || 4;
    const subscribers: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "endpoint", "p256dh", "auth" 
       FROM "push_subscriptions"
       WHERE last_notified_at IS NULL OR last_notified_at <= NOW() - ($1 || ' hours')::interval;`,
      cadenceHours,
    );

    if (!Array.isArray(subscribers) || subscribers.length === 0) {
      return {
        success: true,
        dispatched: false,
        message: `Cadence frequency cap active: All subscribers received an alert within the last ${cadenceHours} hours. Queue item "${item.title}" retained for the next time window.`,
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
        // If 404 or 410 Gone, remove inactive subscription
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

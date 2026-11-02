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
   * Lazily ensures PostgreSQL storage table exists for push subscriptions.
   */
  public static async ensureTable(): Promise<void> {
    if (this.tableEnsured) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "push_subscriptions" (
          "id" VARCHAR(100) PRIMARY KEY,
          "endpoint" TEXT NOT NULL UNIQUE,
          "p256dh" TEXT NOT NULL,
          "auth" TEXT NOT NULL,
          "user_id" VARCHAR(100),
          "user_agent" TEXT,
          "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "push_subscriptions_endpoint_idx" ON "push_subscriptions"("endpoint")
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
   * Broadcasts Web Push notification to all active browser endpoints.
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
      } catch (err: any) {
        failed++;
        // If 404 or 410 Gone, remove inactive subscription
        if (err.statusCode === 404 || err.statusCode === 410) {
          expiredEndpoints.push(sub.endpoint);
        }
      }
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

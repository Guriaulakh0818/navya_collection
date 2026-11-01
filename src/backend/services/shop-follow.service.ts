import { prisma } from '@/lib/prisma';

export class ShopFollowService {
  private static tablesInitialized = false;

  public static async ensureTable(): Promise<void> {
    if (this.tablesInitialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS shop_followers (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          shop_id VARCHAR(100) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (user_id, shop_id)
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_shop_followers_user ON shop_followers(user_id);
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_shop_followers_shop ON shop_followers(shop_id);
      `);

      this.tablesInitialized = true;
    } catch (err: any) {
      console.warn('[ShopFollowService] Table initialization warning:', err.message);
    }
  }

  public static async getFollowStatus(
    shopId: string,
    userId?: string | null,
  ): Promise<{ followerCount: number; isFollowing: boolean }> {
    await this.ensureTable();

    try {
      const countRes: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM shop_followers WHERE shop_id = $1`,
        shopId,
      );
      const followerCount = Number(countRes?.[0]?.count || 0);

      let isFollowing = false;
      if (userId && !userId.startsWith('guest')) {
        const followRes: any = await prisma.$queryRawUnsafe(
          `SELECT id FROM shop_followers WHERE shop_id = $1 AND user_id = $2 LIMIT 1`,
          shopId,
          userId,
        );
        isFollowing = Array.isArray(followRes) && followRes.length > 0;
      }

      return { followerCount, isFollowing };
    } catch (err: any) {
      console.error('[ShopFollowService.getFollowStatus] Error:', err);
      return { followerCount: 0, isFollowing: false };
    }
  }

  public static async toggleFollow(
    userId: string,
    shopId: string,
  ): Promise<{ isFollowing: boolean; followerCount: number }> {
    await this.ensureTable();

    if (!userId || userId.startsWith('guest')) {
      throw new Error('Please login to follow this boutique');
    }

    try {
      const existing: any = await prisma.$queryRawUnsafe(
        `SELECT id FROM shop_followers WHERE shop_id = $1 AND user_id = $2 LIMIT 1`,
        shopId,
        userId,
      );

      let isFollowing = false;
      if (Array.isArray(existing) && existing.length > 0) {
        // Unfollow
        await prisma.$queryRawUnsafe(
          `DELETE FROM shop_followers WHERE shop_id = $1 AND user_id = $2`,
          shopId,
          userId,
        );
        isFollowing = false;
      } else {
        // Follow
        const id = `foll_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        await prisma.$queryRawUnsafe(
          `INSERT INTO shop_followers (id, user_id, shop_id, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (user_id, shop_id) DO NOTHING`,
          id,
          userId,
          shopId,
        );
        isFollowing = true;
      }

      const countRes: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int as count FROM shop_followers WHERE shop_id = $1`,
        shopId,
      );
      const followerCount = Number(countRes?.[0]?.count || 0);

      return { isFollowing, followerCount };
    } catch (err: any) {
      console.error('[ShopFollowService.toggleFollow] Error:', err);
      throw err;
    }
  }

  public static async getUserFollowedShopIds(userId: string): Promise<string[]> {
    if (!userId || userId.startsWith('guest')) return [];
    await this.ensureTable();

    try {
      const rows: any = await prisma.$queryRawUnsafe(
        `SELECT shop_id FROM shop_followers WHERE user_id = $1`,
        userId,
      );
      if (!Array.isArray(rows)) return [];
      return rows.map((r: any) => String(r.shop_id));
    } catch (err: any) {
      console.error('[ShopFollowService.getUserFollowedShopIds] Error:', err);
      return [];
    }
  }
}

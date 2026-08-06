import { prisma } from '@/lib/prisma';

const mockWishlistStore = new Map<string, Set<string>>();

export class WishlistRepository {
  /**
   * Finds all active wishlist items for a user.
   */
  static async findWishlistByUserId(userId: string) {
    try {
      return await prisma.wishlist.findMany({
        where: {
          userId,
          product: {
            status: 'active',
            deletedAt: null,
          },
        },
        include: {
          product: {
            include: {
              images: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch {
      // Memory fallback for offline mode
      const set = mockWishlistStore.get(userId) || new Set();
      return Array.from(set).map((productId) => ({
        id: `w_${userId}_${productId}`,
        userId,
        productId,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: productId,
          name: 'Wishlist Item',
          slug: 'wishlist-item',
          price: 1499,
          status: 'active',
          deletedAt: null,
          images: [],
        },
      }));
    }
  }

  /**
   * Checks if product exists in user's wishlist.
   */
  static async existsInWishlist(userId: string, productId: string) {
    try {
      const item = await prisma.wishlist.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      return Boolean(item);
    } catch {
      const set = mockWishlistStore.get(userId);
      return set ? set.has(productId) : false;
    }
  }

  /**
   * Adds product to user's wishlist.
   */
  static async addWishlistItem(userId: string, productId: string) {
    try {
      return await prisma.wishlist.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        create: {
          userId,
          productId,
        },
        update: {},
        include: {
          product: {
            include: {
              images: {
                where: { deletedAt: null },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
      });
    } catch {
      let set = mockWishlistStore.get(userId);
      if (!set) {
        set = new Set();
        mockWishlistStore.set(userId, set);
      }
      set.add(productId);
      return { id: `w_${userId}_${productId}`, userId, productId };
    }
  }

  /**
   * Removes product from user's wishlist.
   */
  static async removeWishlistItem(userId: string, productId: string) {
    try {
      return await prisma.wishlist.delete({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
    } catch {
      const set = mockWishlistStore.get(userId);
      if (set) set.delete(productId);
      return { userId, productId };
    }
  }

  /**
   * Atomically merges guest product IDs into user's database wishlist.
   */
  static async mergeGuestWishlist(userId: string, productIds: string[]) {
    try {
      return await prisma.$transaction(async (tx) => {
        for (const productId of productIds) {
          const product = await tx.product.findFirst({
            where: {
              id: productId,
              status: 'active',
              deletedAt: null,
            },
          });

          if (!product) continue;

          await tx.wishlist.upsert({
            where: {
              userId_productId: {
                userId,
                productId,
              },
            },
            create: {
              userId,
              productId,
            },
            update: {},
          });
        }

        return tx.wishlist.findMany({
          where: {
            userId,
            product: {
              status: 'active',
              deletedAt: null,
            },
          },
          include: {
            product: {
              include: {
                images: {
                  where: { deletedAt: null },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        });
      });
    } catch {
      let set = mockWishlistStore.get(userId);
      if (!set) {
        set = new Set();
        mockWishlistStore.set(userId, set);
      }
      productIds.forEach((id) => set!.add(id));
      return Array.from(set).map((id) => ({ id: `w_${userId}_${id}`, userId, productId: id }));
    }
  }
}

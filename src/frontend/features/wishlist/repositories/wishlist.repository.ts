import { prisma } from '@/lib/prisma';

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
      return [];
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
      return false;
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
    } catch (err: any) {
      throw new Error(`Failed to add item to wishlist: ${err.message}`);
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
      return [];
    }
  }
}

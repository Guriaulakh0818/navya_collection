import { prisma } from '@/lib/prisma';

const mockImageStore = new Map<string, any>([
  [
    'img_1',
    {
      id: 'img_1',
      productId: 'prd_banarasi_1',
      cloudinaryPublicId: 'navya-collection/products/banarasi_front',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      secureUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
      altText: 'Royal Banarasi Silk Saree Front View',
      sortOrder: 0,
      isPrimary: true,
      width: 1200,
      height: 1600,
      fileSize: 245000,
      format: 'jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ],
]);

export class ImageRepository {
  /**
   * Finds all non-deleted images for a product sorted by display order.
   */
  static async findManyByProductId(productId: string) {
    try {
      return await prisma.productImage.findMany({
        where: {
          productId,
          deletedAt: null,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    } catch {
      return Array.from(mockImageStore.values()).filter(
        (img) => img.productId === productId && img.deletedAt === null,
      );
    }
  }

  /**
   * Finds a single product image by ID.
   */
  static async findById(imageId: string) {
    try {
      return await prisma.productImage.findFirst({
        where: {
          id: imageId,
          deletedAt: null,
        },
      });
    } catch {
      const img = mockImageStore.get(imageId);
      if (img && img.deletedAt === null) return img;
      return null;
    }
  }

  /**
   * Finds the earliest remaining active image for a product.
   */
  static async findFirstActive(productId: string) {
    try {
      return await prisma.productImage.findFirst({
        where: {
          productId,
          deletedAt: null,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    } catch {
      const activeImages = Array.from(mockImageStore.values()).filter(
        (img) => img.productId === productId && img.deletedAt === null,
      );
      return activeImages[0] || null;
    }
  }

  /**
   * Creates a product image record.
   */
  static async create(
    productId: string,
    data: {
      cloudinaryPublicId?: string;
      imageUrl: string;
      secureUrl?: string;
      altText?: string;
      sortOrder?: number;
      isPrimary?: boolean;
      width?: number;
      height?: number;
      fileSize?: number;
      format?: string;
    },
  ) {
    try {
      return await prisma.productImage.create({
        data: {
          productId,
          cloudinaryPublicId: data.cloudinaryPublicId || null,
          imageUrl: data.imageUrl,
          secureUrl: data.secureUrl || data.imageUrl,
          altText: data.altText || null,
          sortOrder: data.sortOrder ?? 0,
          isPrimary: data.isPrimary ?? false,
          width: data.width || null,
          height: data.height || null,
          fileSize: data.fileSize || null,
          format: data.format || null,
        },
      });
    } catch {
      const newId = `img_${Date.now()}`;
      const newImage = {
        id: newId,
        productId,
        cloudinaryPublicId: data.cloudinaryPublicId || `mock_pub_${Date.now()}`,
        imageUrl: data.imageUrl,
        secureUrl: data.secureUrl || data.imageUrl,
        altText: data.altText || null,
        sortOrder: data.sortOrder ?? 0,
        isPrimary: data.isPrimary ?? false,
        width: data.width || 1200,
        height: data.height || 1600,
        fileSize: data.fileSize || 245000,
        format: data.format || 'jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      mockImageStore.set(newId, newImage);
      return newImage;
    }
  }

  /**
   * Updates an existing product image.
   */
  static async update(
    imageId: string,
    data: {
      altText?: string | null;
      sortOrder?: number;
      isPrimary?: boolean;
      imageUrl?: string;
      secureUrl?: string;
      cloudinaryPublicId?: string;
      width?: number;
      height?: number;
      fileSize?: number;
      format?: string;
    },
  ) {
    try {
      return await prisma.productImage.update({
        where: { id: imageId },
        data,
      });
    } catch {
      const existing = mockImageStore.get(imageId);
      if (existing) {
        const updated = {
          ...existing,
          ...data,
          updatedAt: new Date(),
        };
        mockImageStore.set(imageId, updated);
        return updated;
      }
      throw new Error(`Image ${imageId} not found.`);
    }
  }

  /**
   * Sets specific image as Primary, unmarking any existing primary image for that product.
   */
  static async setPrimary(productId: string, primaryImageId: string) {
    try {
      await prisma.$transaction([
        prisma.productImage.updateMany({
          where: { productId },
          data: { isPrimary: false },
        }),
        prisma.productImage.update({
          where: { id: primaryImageId },
          data: { isPrimary: true },
        }),
      ]);
    } catch {
      for (const img of mockImageStore.values()) {
        if (img.productId === productId) {
          img.isPrimary = img.id === primaryImageId;
        }
      }
    }
  }

  /**
   * Bulk updates sort orders for a list of image ordering items.
   */
  static async reorder(
    productId: string,
    imageOrders: Array<{ imageId: string; sortOrder: number }>,
  ) {
    try {
      await prisma.$transaction(
        imageOrders.map((item) =>
          prisma.productImage.update({
            where: { id: item.imageId },
            data: { sortOrder: item.sortOrder },
          }),
        ),
      );
    } catch {
      for (const item of imageOrders) {
        const existing = mockImageStore.get(item.imageId);
        if (existing) {
          existing.sortOrder = item.sortOrder;
        }
      }
    }
  }

  /**
   * Soft deletes a product image.
   */
  static async softDelete(imageId: string) {
    try {
      return await prisma.productImage.update({
        where: { id: imageId },
        data: {
          deletedAt: new Date(),
          isPrimary: false,
        },
      });
    } catch {
      const existing = mockImageStore.get(imageId);
      if (existing) {
        existing.deletedAt = new Date();
        existing.isPrimary = false;
        mockImageStore.set(imageId, existing);
      }
      return existing;
    }
  }
}

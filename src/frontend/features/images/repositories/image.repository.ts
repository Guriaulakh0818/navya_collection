import { prisma } from '@/lib/prisma';

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
      return [];
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
      return null;
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
    } catch (err: any) {
      throw new Error(`Failed to create product image: ${err.message}`);
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
      // Transaction failed
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
      // Reorder transaction failed
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
      return null;
    }
  }
}

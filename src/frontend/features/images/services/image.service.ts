import { ProductRepository } from '@/features/products/repositories/product.repository';
import {
  deleteImageFromCloudinary,
  getOptimizedImageUrl,
  uploadImageToCloudinary,
} from '@/lib/cloudinary';

import { ImageRepository } from '../repositories/image.repository';
import {
  ReorderImagesInput,
  UpdateImageInput,
  UploadMultipleImagesInput,
  UploadSingleImageInput,
} from '../schemas/image.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class ImageService {
  /**
   * Uploads a single product image to Cloudinary and saves database record.
   */
  static async uploadSingleImage(
    productId: string,
    input: UploadSingleImageInput,
  ): Promise<ServiceResponse> {
    try {
      // 1. Verify Product Existence
      const product = await ProductRepository.findByIdOrSlug(productId);
      if (!product) {
        return {
          success: false,
          message: `Product with ID '${productId}' does not exist.`,
          statusCode: 404,
        };
      }

      // 2. Upload image to Cloudinary
      const cloudinaryResult = await uploadImageToCloudinary(
        input.imageUrl,
        `navya-collection/products/${productId}`,
      );

      // 3. Determine if this should be Primary (Auto-assign if no images exist yet)
      const existingImages = await ImageRepository.findManyByProductId(productId);
      const isFirstImage = existingImages.length === 0;
      const shouldBePrimary = input.isPrimary || isFirstImage;

      // 4. Save to Database
      const imageRecord = await ImageRepository.create(productId, {
        cloudinaryPublicId: cloudinaryResult.publicId,
        imageUrl: cloudinaryResult.url,
        secureUrl: cloudinaryResult.secureUrl,
        altText: input.altText || product.name,
        sortOrder: input.sortOrder ?? existingImages.length,
        isPrimary: shouldBePrimary,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        fileSize: cloudinaryResult.fileSize,
        format: cloudinaryResult.format,
      });

      // 5. Enforce single primary image rule
      if (shouldBePrimary) {
        await ImageRepository.setPrimary(productId, imageRecord.id);
      }

      return {
        success: true,
        message: 'Product image uploaded successfully.',
        statusCode: 201,
        data: {
          ...imageRecord,
          optimizedUrl: getOptimizedImageUrl(cloudinaryResult.secureUrl),
        },
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_UPLOAD_SINGLE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to upload product image.',
        statusCode: 500,
      };
    }
  }

  /**
   * Uploads multiple product images to Cloudinary in parallel and saves database records.
   */
  static async uploadMultipleImages(
    productId: string,
    input: UploadMultipleImagesInput,
  ): Promise<ServiceResponse> {
    try {
      // 1. Verify Product Existence
      const product = await ProductRepository.findByIdOrSlug(productId);
      if (!product) {
        return {
          success: false,
          message: `Product with ID '${productId}' does not exist.`,
          statusCode: 404,
        };
      }

      const existingImages = await ImageRepository.findManyByProductId(productId);

      // 2. Upload images to Cloudinary in parallel
      const uploadPromises = input.images.map(async (img, index) => {
        const cloudinaryResult = await uploadImageToCloudinary(
          img.imageUrl,
          `navya-collection/products/${productId}`,
        );

        const isFirstGlobal = existingImages.length === 0 && index === 0;
        const isPrimary = img.isPrimary || isFirstGlobal;

        const record = await ImageRepository.create(productId, {
          cloudinaryPublicId: cloudinaryResult.publicId,
          imageUrl: cloudinaryResult.url,
          secureUrl: cloudinaryResult.secureUrl,
          altText: img.altText || `${product.name} Image ${existingImages.length + index + 1}`,
          sortOrder: img.sortOrder ?? existingImages.length + index,
          isPrimary,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          fileSize: cloudinaryResult.fileSize,
          format: cloudinaryResult.format,
        });

        return {
          ...record,
          optimizedUrl: getOptimizedImageUrl(cloudinaryResult.secureUrl),
        };
      });

      const uploadedImages = await Promise.all(uploadPromises);

      // 3. Ensure primary assignment if marked
      const primaryCandidate = uploadedImages.find((img) => img.isPrimary);
      if (primaryCandidate) {
        await ImageRepository.setPrimary(productId, primaryCandidate.id);
      }

      return {
        success: true,
        message: `Successfully uploaded ${uploadedImages.length} product images.`,
        statusCode: 201,
        data: uploadedImages,
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_UPLOAD_MULTIPLE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to upload product images.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches all non-deleted images of a product enriched with Cloudinary optimized URLs.
   */
  static async getProductImages(productId: string): Promise<ServiceResponse> {
    try {
      const product = await ProductRepository.findByIdOrSlug(productId);
      if (!product) {
        return {
          success: false,
          message: `Product with ID '${productId}' does not exist.`,
          statusCode: 404,
        };
      }

      const images = await ImageRepository.findManyByProductId(productId);

      const enrichedImages = images.map((img) => ({
        ...img,
        optimizedUrl: getOptimizedImageUrl(img.secureUrl || img.imageUrl),
        thumbnailUrl: getOptimizedImageUrl(img.secureUrl || img.imageUrl, {
          width: 300,
          height: 400,
          crop: 'fill',
        }),
      }));

      return {
        success: true,
        message: 'Product images retrieved successfully.',
        statusCode: 200,
        data: enrichedImages,
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve product images.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates an existing product image or replaces its file content in Cloudinary.
   */
  static async updateImage(
    productId: string,
    imageId: string,
    input: UpdateImageInput,
  ): Promise<ServiceResponse> {
    try {
      const existingImage = await ImageRepository.findById(imageId);

      if (!existingImage || existingImage.productId !== productId) {
        return {
          success: false,
          message: `Image with ID '${imageId}' not found for product '${productId}'.`,
          statusCode: 404,
        };
      }

      let updatePayload: any = {
        altText: input.altText !== undefined ? input.altText : existingImage.altText,
        sortOrder: input.sortOrder !== undefined ? input.sortOrder : existingImage.sortOrder,
        isPrimary: input.isPrimary !== undefined ? input.isPrimary : existingImage.isPrimary,
      };

      // File Replacement logic
      if (input.imageUrl) {
        // Delete old Cloudinary asset asynchronously
        if (existingImage.cloudinaryPublicId) {
          deleteImageFromCloudinary(existingImage.cloudinaryPublicId).catch(() => {});
        }

        const cloudinaryResult = await uploadImageToCloudinary(
          input.imageUrl,
          `navya-collection/products/${productId}`,
        );

        updatePayload = {
          ...updatePayload,
          cloudinaryPublicId: cloudinaryResult.publicId,
          imageUrl: cloudinaryResult.url,
          secureUrl: cloudinaryResult.secureUrl,
          width: cloudinaryResult.width,
          height: cloudinaryResult.height,
          fileSize: cloudinaryResult.fileSize,
          format: cloudinaryResult.format,
        };
      }

      const updatedImage = await ImageRepository.update(imageId, updatePayload);

      if (input.isPrimary) {
        await ImageRepository.setPrimary(productId, imageId);
      }

      return {
        success: true,
        message: 'Product image updated successfully.',
        statusCode: 200,
        data: {
          ...updatedImage,
          optimizedUrl: getOptimizedImageUrl(updatedImage.secureUrl || updatedImage.imageUrl),
        },
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update product image.',
        statusCode: 500,
      };
    }
  }

  /**
   * Sets a specific image as Primary for a product.
   */
  static async setPrimaryImage(productId: string, imageId: string): Promise<ServiceResponse> {
    try {
      const existingImage = await ImageRepository.findById(imageId);

      if (!existingImage || existingImage.productId !== productId) {
        return {
          success: false,
          message: `Image with ID '${imageId}' not found for product '${productId}'.`,
          statusCode: 404,
        };
      }

      await ImageRepository.setPrimary(productId, imageId);

      return {
        success: true,
        message: 'Primary product image set successfully.',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_SET_PRIMARY_ERROR]', error);
      return {
        success: false,
        message: 'Failed to set primary product image.',
        statusCode: 500,
      };
    }
  }

  /**
   * Reorders product images based on new sort order list.
   */
  static async reorderImages(
    productId: string,
    input: ReorderImagesInput,
  ): Promise<ServiceResponse> {
    try {
      const product = await ProductRepository.findByIdOrSlug(productId);
      if (!product) {
        return {
          success: false,
          message: `Product with ID '${productId}' does not exist.`,
          statusCode: 404,
        };
      }

      await ImageRepository.reorder(productId, input.imageOrders);

      return {
        success: true,
        message: 'Product images reordered successfully.',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_REORDER_ERROR]', error);
      return {
        success: false,
        message: 'Failed to reorder product images.',
        statusCode: 500,
      };
    }
  }

  /**
   * Soft deletes a product image. If deleting primary image, auto-assigns next available active image.
   */
  static async deleteImage(productId: string, imageId: string): Promise<ServiceResponse> {
    try {
      const existingImage = await ImageRepository.findById(imageId);

      if (!existingImage || existingImage.productId !== productId) {
        return {
          success: false,
          message: `Image with ID '${imageId}' not found for product '${productId}'.`,
          statusCode: 404,
        };
      }

      // 1. Delete asset from Cloudinary asynchronously
      if (existingImage.cloudinaryPublicId) {
        deleteImageFromCloudinary(existingImage.cloudinaryPublicId).catch(() => {});
      }

      // 2. Perform soft delete in DB
      await ImageRepository.softDelete(imageId);

      // 3. Business Rule: Auto-assign new primary image if deleted image was primary
      if (existingImage.isPrimary) {
        const nextActiveImage = await ImageRepository.findFirstActive(productId);
        if (nextActiveImage) {
          await ImageRepository.setPrimary(productId, nextActiveImage.id);
        }
      }

      return {
        success: true,
        message: 'Product image deleted successfully (soft delete).',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[IMAGE_SERVICE_DELETE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to delete product image.',
        statusCode: 500,
      };
    }
  }
}

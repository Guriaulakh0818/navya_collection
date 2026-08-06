import { Prisma } from '@prisma/client';

import { ProductRepository } from '@/features/products/repositories/product.repository';

import { VariantRepository } from '../repositories/variant.repository';
import {
  BulkCreateVariantsInput,
  CreateVariantInput,
  GetVariantQueryParams,
  UpdateVariantInput,
} from '../schemas/variant.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
}

export class VariantService {
  /**
   * Creates a single variant for a product with SKU & Duplicate Size/Color combination checks.
   */
  static async createVariant(
    productId: string,
    input: CreateVariantInput,
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

      // 2. Check SKU Uniqueness Globally
      const existingSku = await VariantRepository.findBySku(input.sku);
      if (existingSku) {
        return {
          success: false,
          message: `Variant with SKU '${input.sku.toUpperCase()}' already exists.`,
          statusCode: 409,
        };
      }

      // 3. Check Duplicate Size + Color Combination for this Product
      if (input.size || input.color) {
        const existingCombo = await VariantRepository.findBySizeAndColor(
          productId,
          input.size,
          input.color,
        );
        if (existingCombo) {
          return {
            success: false,
            message: `Variant with Size '${input.size || 'N/A'}' and Color '${input.color || 'N/A'}' already exists for this product.`,
            statusCode: 409,
          };
        }
      }

      // 4. Create Variant via Repository
      const variant = await VariantRepository.create(productId, input);

      return {
        success: true,
        message: 'Product variant created successfully.',
        statusCode: 201,
        data: variant,
      };
    } catch (error: any) {
      console.error('[VARIANT_SERVICE_CREATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to create product variant.',
        statusCode: 500,
      };
    }
  }

  /**
   * Bulk creates multiple variants for a product in a single operation.
   */
  static async bulkCreateVariants(
    productId: string,
    input: BulkCreateVariantsInput,
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

      // 2. Validate all SKUs and combinations in input batch
      const skuSet = new Set<string>();
      const comboSet = new Set<string>();

      for (const v of input.variants) {
        const formattedSku = v.sku.toUpperCase();
        if (skuSet.has(formattedSku)) {
          return {
            success: false,
            message: `Duplicate SKU '${formattedSku}' inside bulk request payload.`,
            statusCode: 400,
          };
        }
        skuSet.add(formattedSku);

        const comboKey = `${v.size || 'FS'}_${v.color || 'DEFAULT'}`;
        if (comboSet.has(comboKey)) {
          return {
            success: false,
            message: `Duplicate variant combination '${v.size || 'FS'} / ${v.color || 'DEFAULT'}' inside bulk request payload.`,
            statusCode: 400,
          };
        }
        comboSet.add(comboKey);

        // Database SKU conflict check
        const existingSku = await VariantRepository.findBySku(formattedSku);
        if (existingSku) {
          return {
            success: false,
            message: `Variant with SKU '${formattedSku}' already exists in database.`,
            statusCode: 409,
          };
        }
      }

      // 3. Perform Bulk Creation
      const createdVariants = await VariantRepository.bulkCreate(productId, input.variants);

      return {
        success: true,
        message: `Successfully created ${createdVariants.length} product variants.`,
        statusCode: 201,
        data: createdVariants,
      };
    } catch (error: any) {
      console.error('[VARIANT_SERVICE_BULK_CREATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to bulk create product variants.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches all variants for a product (Customer sees only active & in-stock option, Admin sees all).
   */
  static async getVariants(
    productId: string,
    params: GetVariantQueryParams,
    isAdmin: boolean = false,
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

      const where: Prisma.ProductVariantWhereInput = {};

      // Role filter: Non-admins can ONLY view active variants
      if (!isAdmin) {
        where.status = 'active';
      } else if (params.status) {
        where.status = params.status;
      }

      if (params.size) where.size = params.size;
      if (params.color) where.color = params.color;
      if (params.inStock === true) {
        where.stock = { gt: 0 };
      } else if (params.inStock === false) {
        where.stock = 0;
      }

      const variants = await VariantRepository.findManyByProductId(productId, where);

      return {
        success: true,
        message: 'Product variants retrieved successfully.',
        statusCode: 200,
        data: variants,
      };
    } catch (error: any) {
      console.error('[VARIANT_SERVICE_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve product variants.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches single variant by variantId.
   */
  static async getVariantById(variantId: string): Promise<ServiceResponse> {
    try {
      const variant = await VariantRepository.findById(variantId);

      if (!variant) {
        return {
          success: false,
          message: `Variant '${variantId}' not found.`,
          statusCode: 404,
        };
      }

      return {
        success: true,
        message: 'Variant retrieved successfully.',
        statusCode: 200,
        data: variant,
      };
    } catch (error: any) {
      console.error('[VARIANT_SERVICE_GET_BY_ID_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve variant details.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates an existing product variant.
   */
  static async updateVariant(
    productId: string,
    variantId: string,
    input: UpdateVariantInput,
  ): Promise<ServiceResponse> {
    try {
      const existingVariant = await VariantRepository.findById(variantId);

      if (!existingVariant) {
        return {
          success: false,
          message: `Variant with ID '${variantId}' not found.`,
          statusCode: 404,
        };
      }

      if (existingVariant.productId !== productId) {
        return {
          success: false,
          message: `Variant '${variantId}' does not belong to product '${productId}'.`,
          statusCode: 400,
        };
      }

      // Check SKU Uniqueness if updated
      if (input.sku && input.sku.toUpperCase() !== existingVariant.sku) {
        const skuConflict = await VariantRepository.findBySku(input.sku, variantId);
        if (skuConflict) {
          return {
            success: false,
            message: `Variant with SKU '${input.sku.toUpperCase()}' already exists.`,
            statusCode: 409,
          };
        }
      }

      // Check Duplicate Size + Color Combination if updated
      const newSize = input.size !== undefined ? input.size : existingVariant.size;
      const newColor = input.color !== undefined ? input.color : existingVariant.color;

      if (newSize !== existingVariant.size || newColor !== existingVariant.color) {
        const comboConflict = await VariantRepository.findBySizeAndColor(
          productId,
          newSize,
          newColor,
          variantId,
        );
        if (comboConflict) {
          return {
            success: false,
            message: `Variant with Size '${newSize || 'N/A'}' and Color '${newColor || 'N/A'}' already exists.`,
            statusCode: 409,
          };
        }
      }

      const updatedVariant = await VariantRepository.update(variantId, input);

      return {
        success: true,
        message: 'Product variant updated successfully.',
        statusCode: 200,
        data: updatedVariant,
      };
    } catch (error: any) {
      console.error('[VARIANT_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update product variant.',
        statusCode: 500,
      };
    }
  }

  /**
   * Soft deletes a product variant.
   */
  static async deleteVariant(productId: string, variantId: string): Promise<ServiceResponse> {
    try {
      const existingVariant = await VariantRepository.findById(variantId);

      if (!existingVariant) {
        return {
          success: false,
          message: `Variant with ID '${variantId}' not found.`,
          statusCode: 404,
        };
      }

      if (existingVariant.productId !== productId) {
        return {
          success: false,
          message: `Variant '${variantId}' does not belong to product '${productId}'.`,
          statusCode: 400,
        };
      }

      await VariantRepository.softDelete(variantId);

      return {
        success: true,
        message: 'Product variant deleted successfully (soft delete).',
        statusCode: 200,
      };
    } catch (error: any) {
      console.error('[VARIANT_SERVICE_DELETE_ERROR]', error);
      return {
        success: false,
        message: 'Failed to delete product variant.',
        statusCode: 500,
      };
    }
  }
}

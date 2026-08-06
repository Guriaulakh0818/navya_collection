import { Prisma } from '@prisma/client';

import { calculateStockStatus, InventoryRepository } from '../repositories/inventory.repository';
import {
  AdjustStockInput,
  BulkUpdateInventoryInput,
  GetInventoryQueryParams,
  UpdateInventoryInput,
} from '../schemas/inventory.schema';

export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class InventoryService {
  /**
   * Fetches inventory list with pagination, search by SKU/Product Name, and stock status filters.
   * Customers receive sanitized stock availability badge; Admins receive full warehouse metrics.
   */
  static async getInventoryList(
    params: GetInventoryQueryParams,
    isAdmin: boolean = false,
  ): Promise<ServiceResponse> {
    try {
      const { page, limit, search, stockStatus, productId, sortBy, sortOrder } = params;
      const skip = (page - 1) * limit;

      const where: Prisma.ProductVariantWhereInput = {};

      if (stockStatus) where.stockStatus = stockStatus;
      if (productId) where.productId = productId;

      if (search) {
        where.OR = [
          { sku: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { product: { name: { contains: search, mode: 'insensitive' } } },
          { product: { sku: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const orderBy: Prisma.ProductVariantOrderByWithRelationInput = {
        [sortBy]: sortOrder,
      };

      const [inventoryItems, total] = await Promise.all([
        InventoryRepository.findMany(where, skip, limit, orderBy),
        InventoryRepository.count(where),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      // Format response based on caller role
      const data = inventoryItems.map((item) => {
        const isAvailable = item.availableStock > 0;
        const isLowStock = item.availableStock > 0 && item.availableStock <= item.minimumStockLevel;

        let displayBadge = 'Out of Stock';
        if (isLowStock) displayBadge = `Only ${item.availableStock} left`;
        else if (isAvailable) displayBadge = 'In Stock';

        if (!isAdmin) {
          // Public Customer payload: sanitized
          return {
            variantId: item.id,
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            productName: item.product.name,
            stockStatus: item.stockStatus,
            isAvailable,
            displayBadge,
          };
        }

        // Admin payload: full warehouse metrics
        return {
          ...item,
          isAvailable,
          displayBadge,
        };
      });

      return {
        success: true,
        message: 'Inventory retrieved successfully.',
        statusCode: 200,
        data,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      console.error('[INVENTORY_SERVICE_GET_ALL_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve inventory.',
        statusCode: 500,
      };
    }
  }

  /**
   * Fetches inventory details for a single variant.
   */
  static async getVariantInventory(
    variantId: string,
    isAdmin: boolean = false,
  ): Promise<ServiceResponse> {
    try {
      const item = await InventoryRepository.findByVariantId(variantId);

      if (!item) {
        return {
          success: false,
          message: `Inventory record for variant '${variantId}' not found.`,
          statusCode: 404,
        };
      }

      const isAvailable = item.availableStock > 0;
      const isLowStock = item.availableStock > 0 && item.availableStock <= item.minimumStockLevel;

      let displayBadge = 'Out of Stock';
      if (isLowStock) displayBadge = `Only ${item.availableStock} left`;
      else if (isAvailable) displayBadge = 'In Stock';

      const data = !isAdmin
        ? {
            variantId: item.id,
            productId: item.productId,
            name: item.name,
            sku: item.sku,
            stockStatus: item.stockStatus,
            isAvailable,
            displayBadge,
          }
        : {
            ...item,
            isAvailable,
            displayBadge,
          };

      return {
        success: true,
        message: 'Variant inventory retrieved successfully.',
        statusCode: 200,
        data,
      };
    } catch (error: any) {
      console.error('[INVENTORY_SERVICE_GET_BY_ID_ERROR]', error);
      return {
        success: false,
        message: 'Failed to retrieve variant inventory.',
        statusCode: 500,
      };
    }
  }

  /**
   * Updates inventory parameters directly for a variant (Admin Only).
   */
  static async updateInventory(
    variantId: string,
    input: UpdateInventoryInput,
  ): Promise<ServiceResponse> {
    try {
      const existing = await InventoryRepository.findByVariantId(variantId);

      if (!existing) {
        return {
          success: false,
          message: `Inventory record for variant '${variantId}' not found.`,
          statusCode: 404,
        };
      }

      const updated = await InventoryRepository.update(variantId, {
        ...(input.availableStock !== undefined ? { availableStock: input.availableStock } : {}),
        ...(input.minimumStockLevel !== undefined
          ? { minimumStockLevel: input.minimumStockLevel }
          : {}),
        ...(input.maximumStockLevel !== undefined
          ? { maximumStockLevel: input.maximumStockLevel }
          : {}),
        ...(input.availableStock !== undefined && input.availableStock > existing.availableStock
          ? { lastRestockedAt: new Date() }
          : {}),
      });

      return {
        success: true,
        message: 'Inventory updated successfully.',
        statusCode: 200,
        data: updated,
      };
    } catch (error: any) {
      console.error('[INVENTORY_SERVICE_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to update inventory.',
        statusCode: 500,
      };
    }
  }

  /**
   * Performs manual stock adjustments (INCREASE, DECREASE, RESERVE, RELEASE, SET).
   */
  static async adjustStock(variantId: string, input: AdjustStockInput): Promise<ServiceResponse> {
    try {
      const existing = await InventoryRepository.findByVariantId(variantId);

      if (!existing) {
        return {
          success: false,
          message: `Inventory record for variant '${variantId}' not found.`,
          statusCode: 404,
        };
      }

      let newAvailable = existing.availableStock;
      let newReserved = existing.reservedStock;
      let lastRestockedAt = existing.lastRestockedAt;

      switch (input.type) {
        case 'INCREASE':
          newAvailable += input.quantity;
          lastRestockedAt = new Date();
          break;

        case 'DECREASE':
          if (existing.availableStock < input.quantity) {
            return {
              success: false,
              message: `Cannot decrease stock by ${input.quantity}. Available stock is only ${existing.availableStock}.`,
              statusCode: 400,
            };
          }
          newAvailable -= input.quantity;
          break;

        case 'RESERVE':
          if (existing.availableStock < input.quantity) {
            return {
              success: false,
              message: `Cannot reserve ${input.quantity} units. Available stock is only ${existing.availableStock}.`,
              statusCode: 400,
            };
          }
          newAvailable -= input.quantity;
          newReserved += input.quantity;
          break;

        case 'RELEASE':
          if (existing.reservedStock < input.quantity) {
            return {
              success: false,
              message: `Cannot release ${input.quantity} reserved units. Reserved stock is only ${existing.reservedStock}.`,
              statusCode: 400,
            };
          }
          newAvailable += input.quantity;
          newReserved -= input.quantity;
          break;

        case 'SET':
          newAvailable = input.quantity;
          if (input.quantity > existing.availableStock) {
            lastRestockedAt = new Date();
          }
          break;
      }

      const updated = await InventoryRepository.update(variantId, {
        availableStock: newAvailable,
        reservedStock: newReserved,
        lastRestockedAt,
      });

      return {
        success: true,
        message: `Stock successfully adjusted (${input.type} ${input.quantity}).`,
        statusCode: 200,
        data: updated,
      };
    } catch (error: any) {
      console.error('[INVENTORY_SERVICE_ADJUST_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to adjust stock.',
        statusCode: 500,
      };
    }
  }

  /**
   * Bulk updates stock levels for multiple variants (Admin Only).
   */
  static async bulkUpdateInventory(input: BulkUpdateInventoryInput): Promise<ServiceResponse> {
    try {
      const updatedItems = await InventoryRepository.bulkUpdate(input.items);

      return {
        success: true,
        message: `Successfully updated inventory for ${updatedItems.length} variants.`,
        statusCode: 200,
        data: updatedItems,
      };
    } catch (error: any) {
      console.error('[INVENTORY_SERVICE_BULK_UPDATE_ERROR]', error);
      return {
        success: false,
        message: error.message || 'Failed to bulk update inventory.',
        statusCode: 500,
      };
    }
  }
}

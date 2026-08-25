import { ShopStatus } from '@prisma/client';

/**
 * Central Public Visibility Filter for Shops.
 * Enforces that ONLY shops with status = APPROVED and deletedAt = null
 * are ever visible on the public/customer-facing website.
 */
export const PUBLIC_SHOP_WHERE = {
  status: ShopStatus.APPROVED,
  deletedAt: null,
};

/**
 * Central Public Visibility Filter for Products.
 * Enforces that products are active, non-deleted, AND belong to an APPROVED, non-deleted Shop.
 */
export const PUBLIC_PRODUCT_WHERE = {
  status: 'active',
  deletedAt: null,
  shop: {
    status: ShopStatus.APPROVED,
    deletedAt: null,
  },
};

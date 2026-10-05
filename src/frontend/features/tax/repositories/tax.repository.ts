import { prisma } from '@/lib/prisma';

export interface TaxRuleConfig {
  id: string;
  name: string;
  country: string;
  state?: string | null;
  taxType: 'GST' | 'IGST' | 'CGST_SGST';
  taxPercentage: number;
  isDefault: boolean;
  isActive: boolean;
}

export interface SellerTaxProfile {
  shopId: string;
  shopName: string;
  state: string;
  isGstRegistered: boolean;
  gstin: string | null;
  gstStatus: 'REGISTERED' | 'UNREGISTERED';
}

export class TaxRepository {
  /**
   * Returns active store origin state (default: Haryana, headquarters).
   */
  static getStoreHomeState(): string {
    return process.env.STORE_HOME_STATE || 'Haryana';
  }

  /**
   * Retrieves active default tax configuration from DB if configured.
   */
  static async getDefaultTaxConfig(): Promise<TaxRuleConfig | null> {
    try {
      const config = await prisma.taxConfiguration.findFirst({
        where: { isDefault: true, isActive: true },
      });
      if (config) {
        return {
          id: config.id,
          name: config.name,
          country: config.country,
          state: config.state,
          taxType: config.taxType as any,
          taxPercentage: Number(config.taxPercentage),
          isDefault: config.isDefault,
          isActive: config.isActive,
        };
      }
    } catch {
      // Memory fallback
    }
    return null;
  }

  /**
   * Resolves seller GST registration profiles for multi-seller tax assessment.
   */
  static async getSellerTaxProfiles(shopIds: string[]): Promise<Map<string, SellerTaxProfile>> {
    const profileMap = new Map<string, SellerTaxProfile>();
    const validShopIds = shopIds.filter(Boolean);
    if (validShopIds.length === 0) return profileMap;

    try {
      const shops = await prisma.shop.findMany({
        where: { id: { in: validShopIds } },
        select: {
          id: true,
          name: true,
          state: true,
          gstin: true,
          sellerProfile: {
            select: {
              gstin: true,
              state: true,
              status: true,
            },
          },
        },
      });

      for (const shop of shops) {
        const gstin = (shop.gstin || shop.sellerProfile?.gstin || '').trim();
        // Valid GSTIN in India is 15 alphanumeric characters
        const isRegistered = Boolean(gstin && gstin.length >= 10);
        profileMap.set(shop.id, {
          shopId: shop.id,
          shopName: shop.name,
          state: shop.state || shop.sellerProfile?.state || this.getStoreHomeState(),
          isGstRegistered: isRegistered,
          gstin: gstin || null,
          gstStatus: isRegistered ? 'REGISTERED' : 'UNREGISTERED',
        });
      }
    } catch (err) {
      console.warn('[TAX_REPOSITORY_SELLER_PROFILE_FETCH_ERR]', err);
    }

    return profileMap;
  }
}

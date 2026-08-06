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

const DEFAULT_STORE_CONFIG: TaxRuleConfig = {
  id: 'tax_default_18',
  name: 'Standard GST 18%',
  country: 'India',
  state: 'Maharashtra',
  taxType: 'GST',
  taxPercentage: 18,
  isDefault: true,
  isActive: true,
};

export class TaxRepository {
  /**
   * Returns active store origin state (default: Maharashtra).
   */
  static getStoreHomeState(): string {
    return process.env.STORE_HOME_STATE || 'Maharashtra';
  }

  /**
   * Retrieves active default tax configuration.
   */
  static async getDefaultTaxConfig(): Promise<TaxRuleConfig> {
    try {
      const config = await (prisma as any).taxConfiguration?.findFirst({
        where: { isDefault: true, isActive: true },
      });
      if (config) {
        return {
          id: config.id,
          name: config.name,
          country: config.country,
          state: config.state,
          taxType: config.taxType,
          taxPercentage: Number(config.taxPercentage),
          isDefault: config.isDefault,
          isActive: config.isActive,
        };
      }
    } catch {
      // Memory fallback mode
    }

    return DEFAULT_STORE_CONFIG;
  }
}

import { PlatformTaxType, Prisma, PrismaClient } from '@prisma/client';

import { MARKETPLACE_CONFIG } from '@/backend/config/marketplace.config';
import { CommissionService } from '@/backend/services/commission.service';
import { prisma } from '@/lib/prisma';

export { PlatformTaxType };

export interface TaxCalculationResult {
  taxType: PlatformTaxType;
  taxableAmount: number;
  taxRate: number; // e.g. 0.18 for 18%
  taxAmount: number;
  taxRuleVersion: string;
  ruleVersion: string | number;
  effectiveDate: Date;
}

export interface CalculateTaxInput {
  taxType: PlatformTaxType;
  taxableAmount: number;
  transactionDate?: Date | string | null;
  context?: Record<string, any>;
  client?: PrismaClient | Prisma.TransactionClient;
}

export interface EffectiveTaxRule {
  id: string;
  taxType: PlatformTaxType;
  rate: number;
  version: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

export class PlatformTaxService {
  private static defaultRates: Record<PlatformTaxType, number> = {
    [PlatformTaxType.PLATFORM_COMMISSION_GST]:
      MARKETPLACE_CONFIG.TAX?.COMMISSION_SERVICE_GST_RATE ?? 0.18,
    [PlatformTaxType.COD_FEE_GST]: MARKETPLACE_CONFIG.TAX?.COMMISSION_SERVICE_GST_RATE ?? 0.18,
    [PlatformTaxType.PAYMENT_GATEWAY_GST]: 0.18,
    [PlatformTaxType.CUSTOMER_SHIPPING_GST]: 0.18,
    [PlatformTaxType.PRODUCT_GST]: MARKETPLACE_CONFIG.TAX?.APPAREL_SUB_1000_GST_RATE ?? 0.05,
  };

  /**
   * Retrieves the authoritative active tax rule for a given taxType and effective date.
   */
  public static async getEffectiveTaxRule(
    taxType: PlatformTaxType,
    transactionDate?: Date | string | null,
    txClient?: PrismaClient | Prisma.TransactionClient,
  ): Promise<EffectiveTaxRule> {
    const client = txClient || prisma;
    const targetDate = transactionDate ? new Date(transactionDate) : new Date();

    try {
      if (client.platformTaxRule?.findFirst) {
        const rule = await client.platformTaxRule.findFirst({
          where: {
            taxType,
            isActive: true,
            effectiveFrom: { lte: targetDate },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: targetDate } }],
          },
          orderBy: { effectiveFrom: 'desc' },
        });

        if (rule) {
          return {
            id: rule.id,
            taxType: rule.taxType,
            rate: Number(rule.rate),
            version: rule.version,
            effectiveFrom: rule.effectiveFrom,
            effectiveTo: rule.effectiveTo,
            isActive: rule.isActive,
          };
        }
      }
    } catch (dbErr) {
      // In-memory fallback if database is unavailable or during early bootstrap
      console.warn('[PLATFORM_TAX_FALLBACK_WARN]', dbErr);
    }

    // Authoritative fallback rate based on marketplace config
    const fallbackRate = this.defaultRates[taxType] ?? 0.18;
    return {
      id: `default-${taxType.toLowerCase()}`,
      taxType,
      rate: fallbackRate,
      version: 'v1.0-default',
      effectiveFrom: new Date(0),
      effectiveTo: null,
      isActive: true,
    };
  }

  /**
   * Authoritative dynamic tax calculation engine.
   * Taxable Event -> Tax Rule / Tax Configuration -> Applicable Rate -> Tax Amount -> Historical Snapshot
   */
  public static async calculateTax(input: CalculateTaxInput): Promise<TaxCalculationResult> {
    const { taxType, taxableAmount, transactionDate, client } = input;
    const amount = Math.max(0, CommissionService.roundMoney(taxableAmount || 0));

    if (amount === 0) {
      const rule = await this.getEffectiveTaxRule(taxType, transactionDate, client);
      return {
        taxType,
        taxableAmount: 0,
        taxRate: rule.rate,
        taxAmount: 0,
        taxRuleVersion: rule.version,
        ruleVersion: rule.version,
        effectiveDate: rule.effectiveFrom,
      };
    }

    const rule = await this.getEffectiveTaxRule(taxType, transactionDate, client);
    const taxAmount = CommissionService.roundMoney(amount * rule.rate);

    return {
      taxType,
      taxableAmount: amount,
      taxRate: rule.rate,
      taxAmount,
      taxRuleVersion: rule.version,
      ruleVersion: rule.version,
      effectiveDate: rule.effectiveFrom,
    };
  }

  /**
   * Admin-only: Updates or sets an authoritative tax rule with audit tracking.
   */
  public static async setTaxRule(params: {
    taxType: PlatformTaxType;
    rate: number;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
    version?: string;
    description?: string;
    performedById?: string;
  }) {
    const {
      taxType,
      rate,
      effectiveFrom = new Date(),
      effectiveTo = null,
      version = 'v1.1',
      description,
      performedById,
    } = params;

    const newRule = await prisma.$transaction(async (tx) => {
      // Deactivate overlapping current rule if needed
      await tx.platformTaxRule.updateMany({
        where: {
          taxType,
          isActive: true,
          effectiveTo: null,
        },
        data: {
          effectiveTo: effectiveFrom,
        },
      });

      const rule = await tx.platformTaxRule.create({
        data: {
          taxType,
          rate: new Prisma.Decimal(rate),
          effectiveFrom,
          effectiveTo,
          isActive: true,
          version,
          description: description || `Updated rate for ${taxType} to ${rate * 100}%`,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          entityType: 'COMMISSION',
          entityId: rule.id,
          action: 'PLATFORM_TAX_RULE_UPDATED',
          performedById: performedById || 'ADMIN',
          amount: rate,
          notes: `Set ${taxType} rate to ${rate * 100}% (Version: ${version}). Effective from ${effectiveFrom.toISOString()}`,
          newValues: { taxType, rate, version },
        },
      });

      return rule;
    });

    return newRule;
  }
}

import { Prisma, PrismaClient } from '@prisma/client';

import { MARKETPLACE_CONFIG } from '@/backend/config/marketplace.config';
import { CommissionService } from '@/backend/services/commission.service';
import { PlatformTaxService, PlatformTaxType } from '@/backend/services/platform-tax.service';
import { prisma } from '@/lib/prisma';

export interface EffectiveGatewayConfig {
  id: string;
  provider: string;
  estimateRate: number;
  paymentMethod: string | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  isActive: boolean;
}

export interface EstimatedGatewayFeeResult {
  fee: number;
  tax: number;
  total: number;
  estimateRate: number;
  estimateTaxRate: number;
  status: 'ESTIMATED';
  provider: string;
  // Aliases for convenience and downstream callers
  estimatedFee: number;
  estimatedTax: number;
  totalEstimatedGatewayCost: number;
  taxRate: number;
  gatewayFeeStatus: 'ESTIMATED';
}

export class PaymentGatewayConfigService {
  private static defaultEstimateRate = 0.02; // Baseline fallback if database uninitialized

  /**
   * Retrieves active gateway pricing configuration for provider, method, and transaction date.
   */
  public static async getEffectiveConfig(
    params: {
      provider?: string;
      paymentMethod?: string | null;
      transactionDate?: Date | string | null;
      txClient?: PrismaClient | Prisma.TransactionClient;
    } = {},
  ): Promise<EffectiveGatewayConfig> {
    const client = params.txClient || prisma;
    const provider = params.provider || 'RAZORPAY';
    const targetDate = params.transactionDate ? new Date(params.transactionDate) : new Date();

    try {
      if (client.paymentGatewayConfig?.findFirst) {
        const config = await client.paymentGatewayConfig.findFirst({
          where: {
            provider,
            isActive: true,
            effectiveFrom: { lte: targetDate },
            OR: [{ effectiveTo: null }, { effectiveTo: { gte: targetDate } }],
            ...(params.paymentMethod
              ? { OR: [{ paymentMethod: params.paymentMethod }, { paymentMethod: null }] }
              : {}),
          },
          orderBy: [{ paymentMethod: 'desc' }, { effectiveFrom: 'desc' }],
        });

        if (config) {
          return {
            id: config.id,
            provider: config.provider,
            estimateRate: Number(config.estimateRate),
            paymentMethod: config.paymentMethod,
            effectiveFrom: config.effectiveFrom,
            effectiveTo: config.effectiveTo,
            isActive: config.isActive,
          };
        }
      }
    } catch (dbErr) {
      console.warn('[GATEWAY_CONFIG_FALLBACK_WARN]', dbErr);
    }

    return {
      id: `default-${provider.toLowerCase()}`,
      provider,
      estimateRate: this.defaultEstimateRate,
      paymentMethod: null,
      effectiveFrom: new Date(0),
      effectiveTo: null,
      isActive: true,
    };
  }

  /**
   * Authoritative dynamic calculation of estimated gateway fee and gateway tax.
   * Uses configured estimateRate and dynamically resolved PAYMENT_GATEWAY_GST.
   */
  public static async estimateGatewayFee(params: {
    amount?: number;
    taxableAmount?: number;
    provider?: string;
    paymentMethod?: string | null;
    transactionDate?: Date | string | null;
    client?: PrismaClient | Prisma.TransactionClient;
  }): Promise<EstimatedGatewayFeeResult> {
    const { provider = 'RAZORPAY', paymentMethod, transactionDate, client } = params;
    const rawAmt = params.taxableAmount ?? params.amount ?? 0;
    const safeAmount = Math.max(0, CommissionService.roundMoney(rawAmt));

    const config = await this.getEffectiveConfig({
      provider,
      paymentMethod,
      transactionDate,
      txClient: client,
    });

    if (safeAmount === 0) {
      return {
        fee: 0,
        tax: 0,
        total: 0,
        estimateRate: config.estimateRate,
        estimateTaxRate: 0.18,
        status: 'ESTIMATED',
        provider,
        estimatedFee: 0,
        estimatedTax: 0,
        totalEstimatedGatewayCost: 0,
        taxRate: 0.18,
        gatewayFeeStatus: 'ESTIMATED',
      };
    }

    // Dynamic MDR fee calculation based on configured estimateRate
    const fee = CommissionService.roundMoney(safeAmount * config.estimateRate);

    // Dynamic GST calculation on gateway service fee via PlatformTaxService
    const taxRes = await PlatformTaxService.calculateTax({
      taxType: PlatformTaxType.PAYMENT_GATEWAY_GST,
      taxableAmount: fee,
      transactionDate,
      client,
    });

    const tax = taxRes.taxAmount;
    const total = CommissionService.roundMoney(fee + tax);

    return {
      fee,
      tax,
      total,
      estimateRate: config.estimateRate,
      estimateTaxRate: taxRes.taxRate,
      status: 'ESTIMATED',
      provider,
      estimatedFee: fee,
      estimatedTax: tax,
      totalEstimatedGatewayCost: total,
      taxRate: taxRes.taxRate,
      gatewayFeeStatus: 'ESTIMATED',
    };
  }

  /**
   * Admin-only: Updates or adds a new gateway estimation rate rule with audit logging.
   */
  public static async setGatewayConfig(params: {
    provider?: string;
    estimateRate: number;
    paymentMethod?: string | null;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
    performedById?: string;
    notes?: string;
  }) {
    const {
      provider = 'RAZORPAY',
      estimateRate,
      paymentMethod = null,
      effectiveFrom = new Date(),
      effectiveTo = null,
      performedById,
      notes,
    } = params;

    const newConfig = await prisma.$transaction(async (tx) => {
      // Deactivate overlapping current config
      await tx.paymentGatewayConfig.updateMany({
        where: {
          provider,
          paymentMethod,
          isActive: true,
          effectiveTo: null,
        },
        data: {
          effectiveTo: effectiveFrom,
        },
      });

      const created = await tx.paymentGatewayConfig.create({
        data: {
          provider,
          estimateRate: new Prisma.Decimal(estimateRate),
          paymentMethod,
          effectiveFrom,
          effectiveTo,
          isActive: true,
          metadata: notes ? { notes } : undefined,
        },
      });

      await tx.financialAuditLog.create({
        data: {
          entityType: 'PAYMENT',
          entityId: created.id,
          action: 'PAYMENT_GATEWAY_CONFIG_UPDATED',
          performedById: performedById || 'ADMIN',
          amount: estimateRate,
          notes: `Set ${provider} gateway estimate rate to ${estimateRate * 100}%. Effective from ${effectiveFrom.toISOString()}`,
          newValues: { provider, estimateRate, paymentMethod },
        },
      });

      return created;
    });

    return newConfig;
  }
}

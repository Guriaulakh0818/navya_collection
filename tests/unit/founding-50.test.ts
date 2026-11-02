import { describe, expect, it } from 'vitest';

import { Founding50Service } from '../../src/backend/services/founding-50.service';

describe('JiivaaKart Founding 50 Service Unit Tests (Version 1.0)', () => {
  describe('1. Commission Rate Resolution (Delivered Order Milestones)', () => {
    it('Non-founding sellers must always receive the standard 10% rate', () => {
      const res0 = Founding50Service.resolveCommissionRate(false, 0);
      expect(res0.rate).toBe(10.0);
      expect(res0.tierLabel).toBe('STANDARD_10_PERCENT');
      expect(res0.isPromotional).toBe(false);

      const res5 = Founding50Service.resolveCommissionRate(false, 5);
      expect(res5.rate).toBe(10.0);
      expect(res5.isPromotional).toBe(false);
    });

    it('Founding seller with 0 delivered orders (Order #1) gets 5.0% rate', () => {
      const res = Founding50Service.resolveCommissionRate(true, 0);
      expect(res.rate).toBe(5.0);
      expect(res.tierLabel).toBe('TIER_1_5_PERCENT');
      expect(res.orderIndex).toBe(1);
      expect(res.isPromotional).toBe(true);
      expect(res.remainingInTier).toBe(10);
    });

    it('Founding seller with 9 delivered orders (Order #10) gets 5.0% rate', () => {
      const res = Founding50Service.resolveCommissionRate(true, 9);
      expect(res.rate).toBe(5.0);
      expect(res.tierLabel).toBe('TIER_1_5_PERCENT');
      expect(res.orderIndex).toBe(10);
      expect(res.isPromotional).toBe(true);
      expect(res.remainingInTier).toBe(1);
    });

    it('Founding seller with 10 delivered orders (Order #11) transitions to 7.5% rate', () => {
      const res = Founding50Service.resolveCommissionRate(true, 10);
      expect(res.rate).toBe(7.5);
      expect(res.tierLabel).toBe('TIER_2_7_5_PERCENT');
      expect(res.orderIndex).toBe(11);
      expect(res.isPromotional).toBe(true);
      expect(res.remainingInTier).toBe(10);
    });

    it('Founding seller with 19 delivered orders (Order #20) gets 7.5% rate', () => {
      const res = Founding50Service.resolveCommissionRate(true, 19);
      expect(res.rate).toBe(7.5);
      expect(res.tierLabel).toBe('TIER_2_7_5_PERCENT');
      expect(res.orderIndex).toBe(20);
      expect(res.isPromotional).toBe(true);
      expect(res.remainingInTier).toBe(1);
    });

    it('Founding seller with 20 delivered orders (Order #21+) transitions to standard 10.0% rate', () => {
      const res21 = Founding50Service.resolveCommissionRate(true, 20);
      expect(res21.rate).toBe(10.0);
      expect(res21.tierLabel).toBe('STANDARD_10_PERCENT');
      expect(res21.orderIndex).toBe(21);
      expect(res21.isPromotional).toBe(false);
      expect(res21.remainingInTier).toBe(0);

      const res50 = Founding50Service.resolveCommissionRate(true, 50);
      expect(res50.rate).toBe(10.0);
      expect(res50.isPromotional).toBe(false);
    });
  });

  describe('2. Commission Math Comparison (5% vs 7.5% vs 10%)', () => {
    it('Order MRP ₹2,000 saves ₹100 on Tier 1 (5% = ₹100 vs 10% = ₹200)', () => {
      const mrp = 2000;
      const tier1Rate = Founding50Service.RATE_TIER_1;
      const standardRate = Founding50Service.RATE_STANDARD;

      const commTier1 = (mrp * tier1Rate) / 100;
      const commStandard = (mrp * standardRate) / 100;

      expect(commTier1).toBe(100);
      expect(commStandard).toBe(200);
      expect(commStandard - commTier1).toBe(100); // 50% fee savings!
    });

    it('Order MRP ₹2,000 saves ₹50 on Tier 2 (7.5% = ₹150 vs 10% = ₹200)', () => {
      const mrp = 2000;
      const tier2Rate = Founding50Service.RATE_TIER_2;
      const standardRate = Founding50Service.RATE_STANDARD;

      const commTier2 = (mrp * tier2Rate) / 100;
      const commStandard = (mrp * standardRate) / 100;

      expect(commTier2).toBe(150);
      expect(commStandard).toBe(200);
      expect(commStandard - commTier2).toBe(50); // 25% fee savings!
    });
  });
});

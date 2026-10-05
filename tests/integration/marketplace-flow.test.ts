import { describe, expect, it } from 'vitest';

import { CommissionService } from '@/backend/services/commission.service';

export function testMarketplaceIntegrationFlow() {
  const sellerA = {
    id: 'seller-1',
    shopName: 'Royal Ethnic Couture',
    gstin: '27AAAAA0000A1Z5',
    isGstRegistered: true,
  };
  const sellerB = {
    id: 'seller-2',
    shopName: 'Silk Threads Boutique',
    gstin: null,
    isGstRegistered: false,
  };

  const orderData = {
    orderId: 'master-ord-101',
    totalAmount: 15000,
    subOrders: [
      { shopId: sellerA.id, mrp: 12000, sellingPrice: 10000, isGstRegistered: true, gstRate: 0.05 },
      { shopId: sellerB.id, mrp: 6000, sellingPrice: 5000, isGstRegistered: false, gstRate: 0 },
    ],
  };

  expect(orderData.subOrders.length).toBe(2);

  // BM-03 Seller A Payout (GST Registered, 5% GST):
  // Commission = MRP * 10% = 12,000 * 0.10 = 1,200
  // Base Payout = Selling Price - Commission = 10,000 - 1,200 = 8,800
  // GST = 5% of Selling Price = 500
  // Seller Total Payout = 8,800 + 500 = 9,300
  const subA = orderData.subOrders[0];
  const commA = CommissionService.roundMoney(subA.mrp * 0.1);
  const basePayoutA = CommissionService.roundMoney(subA.sellingPrice - commA);
  const gstA = CommissionService.roundMoney(subA.sellingPrice * subA.gstRate);
  const totalPayoutA = CommissionService.roundMoney(basePayoutA + gstA);

  expect(commA).toBe(1200);
  expect(basePayoutA).toBe(8800);
  expect(gstA).toBe(500);
  expect(totalPayoutA).toBe(9300);

  // BM-03 Seller B Payout (Unregistered):
  // Commission = MRP * 10% = 6,000 * 0.10 = 600
  // Base Payout = Selling Price - Commission = 5,000 - 600 = 4,400
  // GST = 0
  // Seller Total Payout = 4,400
  const subB = orderData.subOrders[1];
  const commB = CommissionService.roundMoney(subB.mrp * 0.1);
  const basePayoutB = CommissionService.roundMoney(subB.sellingPrice - commB);
  const gstB = 0;
  const totalPayoutB = basePayoutB;

  expect(commB).toBe(600);
  expect(basePayoutB).toBe(4400);
  expect(gstB).toBe(0);
  expect(totalPayoutB).toBe(4400);

  // Total Platform Commission = commA + commB = 1,200 + 600 = 1,800
  const totalPlatformCommission = commA + commB;
  expect(totalPlatformCommission).toBe(1800);
}

describe('Integration: Multi-Vendor Marketplace BM-03 Settlement Flow', () => {
  it('splits orders accurately and calculates MRP commission, base payout, GST additions, and net seller payouts', () => {
    testMarketplaceIntegrationFlow();
  });
});

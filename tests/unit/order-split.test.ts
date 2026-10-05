import { describe, expect, it } from 'vitest';

import { CommissionService } from '@/backend/services/commission.service';

export function testOrderSplitUnit() {
  const cartItems = [
    { productId: 'p1', shopId: 'shop-a', name: 'Lehenga A', mrp: 6000, price: 5000, quantity: 1 },
    { productId: 'p2', shopId: 'shop-a', name: 'Dupatta A', mrp: 1500, price: 1000, quantity: 1 },
    { productId: 'p3', shopId: 'shop-b', name: 'Saree B', mrp: 5000, price: 4000, quantity: 1 },
  ];

  // Group items by shopId
  const shopGroups: Record<string, typeof cartItems> = {};
  cartItems.forEach((item) => {
    if (!shopGroups[item.shopId]) shopGroups[item.shopId] = [];
    shopGroups[item.shopId].push(item);
  });

  expect(Object.keys(shopGroups).length).toBe(2);
  expect(shopGroups['shop-a'].length).toBe(2);
  expect(shopGroups['shop-b'].length).toBe(1);

  // Shop A totals (BM-03: GST Registered, 5% GST rate)
  const shopASelling = shopGroups['shop-a'].reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shopAMrp = shopGroups['shop-a'].reduce((acc, item) => acc + item.mrp * item.quantity, 0);
  // Navya Commission = MRP * 10%
  const shopACommission = CommissionService.roundMoney(shopAMrp * 0.1);
  // Seller Base Payout = Selling Price - Commission
  const shopABasePayout = CommissionService.roundMoney(shopASelling - shopACommission);
  // GST Registered: 5% of Selling Price
  const shopAGst = CommissionService.roundMoney(shopASelling * 0.05);
  // Seller Total Payout = Base Payout + GST
  const shopATotalPayout = CommissionService.roundMoney(shopABasePayout + shopAGst);

  expect(shopASelling).toBe(6000);
  expect(shopAMrp).toBe(7500);
  expect(shopACommission).toBe(750);
  expect(shopABasePayout).toBe(5250);
  expect(shopAGst).toBe(300);
  expect(shopATotalPayout).toBe(5550);

  // Shop B totals (BM-03: Unregistered Seller, GST = 0)
  const shopBSelling = shopGroups['shop-b'].reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shopBMrp = shopGroups['shop-b'].reduce((acc, item) => acc + item.mrp * item.quantity, 0);
  const shopBCommission = CommissionService.roundMoney(shopBMrp * 0.1);
  const shopBBasePayout = CommissionService.roundMoney(shopBSelling - shopBCommission);
  const shopBGst = 0; // Unregistered
  const shopBTotalPayout = shopBBasePayout;

  expect(shopBSelling).toBe(4000);
  expect(shopBMrp).toBe(5000);
  expect(shopBCommission).toBe(500);
  expect(shopBBasePayout).toBe(3500);
  expect(shopBGst).toBe(0);
  expect(shopBTotalPayout).toBe(3500);
}

describe('Unit: Multi-Vendor Order Split & BM-03 Commission Calculation', () => {
  it('groups items by vendor shopId and calculates MRP commission, base payout, GST, and total payout', () => {
    testOrderSplitUnit();
  });
});

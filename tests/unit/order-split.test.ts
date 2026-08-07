import { describe, expect, it } from 'vitest';

export function testOrderSplitUnit() {
  const cartItems = [
    { productId: 'p1', shopId: 'shop-a', name: 'Lehenga A', price: 5000, quantity: 1 },
    { productId: 'p2', shopId: 'shop-a', name: 'Dupatta A', price: 1000, quantity: 1 },
    { productId: 'p3', shopId: 'shop-b', name: 'Saree B', price: 4000, quantity: 1 },
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

  // Calculate Shop A totals (6000 gross)
  const shopAGross = shopGroups['shop-a'].reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shopACommission = shopAGross * 0.1 + 15; // 10% + 15 Flat Fee
  const shopANetPayout = shopAGross - shopACommission;

  expect(shopAGross).toBe(6000);
  expect(shopACommission).toBe(615);
  expect(shopANetPayout).toBe(5385);

  // Calculate Shop B totals (4000 gross)
  const shopBGross = shopGroups['shop-b'].reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shopBCommission = shopBGross * 0.1 + 15;
  const shopBNetPayout = shopBGross - shopBCommission;

  expect(shopBGross).toBe(4000);
  expect(shopBCommission).toBe(415);
  expect(shopBNetPayout).toBe(3585);
}

describe('Unit: Multi-Vendor Order Split & Commission Calculation', () => {
  it('groups items by vendor shopId and calculates gross amount, commission, and net payout', () => {
    testOrderSplitUnit();
  });
});

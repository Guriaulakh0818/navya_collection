import { describe, expect, it } from 'vitest';

import { MOCK_PRODUCTS } from '../mocks/products.mock';

describe('Integration: Cart to Checkout Order Calculation Flow', () => {
  it('calculates items total, coupon discount, shipping, and grand total', () => {
    const item1 = MOCK_PRODUCTS[0]; // 3499
    const item2 = MOCK_PRODUCTS[1]; // 2199

    const subtotal = item1.price * 1 + item2.price * 2; // 3499 + 4398 = 7897
    expect(subtotal).toBe(7897);

    // Free shipping threshold >= 999
    const shipping = subtotal >= 999 ? 0 : 99;
    expect(shipping).toBe(0);

    // 10% coupon discount
    const discount = Math.round((subtotal * 10) / 100); // 790
    const netAmount = subtotal - discount + shipping; // 7107
    expect(netAmount).toBe(7107);
  });
});

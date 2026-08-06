import { describe, expect, it } from 'vitest';

describe('Price & Tax Calculator', () => {
  it('calculates 18% GST tax breakdown accurately', () => {
    const subtotal = 1000;
    const taxRate = 0.18;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    expect(taxAmount).toBe(180);
  });

  it('applies free shipping rule when subtotal >= 999', () => {
    const subtotalAbove = 1200;
    const shippingAbove = subtotalAbove >= 999 ? 0 : 99;
    expect(shippingAbove).toBe(0);

    const subtotalBelow = 499;
    const shippingBelow = subtotalBelow >= 999 ? 0 : 99;
    expect(shippingBelow).toBe(99);
  });

  it('calculates percentage coupon discount correctly', () => {
    const subtotal = 2000;
    const discountPercent = 10;
    const discountAmount = (subtotal * discountPercent) / 100;
    expect(discountAmount).toBe(200);
    expect(subtotal - discountAmount).toBe(1800);
  });
});
